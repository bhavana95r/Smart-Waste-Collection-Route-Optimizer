import math
import json
import networkx as nx

# Try to import OR-Tools for advanced VRP
OR_TOOLS_AVAILABLE = False
try:
    from ortools.constraint_solver import routing_enums_pb2
    from ortools.constraint_solver import pywrapcp
    OR_TOOLS_AVAILABLE = True
except ImportError:
    pass

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points in km."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_fuel_and_co2(distance_km, vehicle_type, fill_percentage=50.0):
    """
    Calculate fuel usage (liters) and CO2 emissions (kg) based on vehicle type and weight load.
    Diesel: ~0.35L/km empty, up to ~0.45L/km loaded.
    CNG: ~0.30 kg/km empty, up to ~0.38 kg/km loaded.
    Electric: 0.0 L/km fuel, but CO2 from grid (simulated).
    """
    load_factor = 1.0 + (fill_percentage / 100.0) * 0.28  # up to 28% more fuel when fully loaded
    
    if vehicle_type.lower() == 'electric':
        fuel = 0.0
        co2 = distance_km * 0.15 * load_factor # grid emissions equivalent
    elif vehicle_type.lower() == 'cng':
        fuel = distance_km * 0.32 * load_factor # in kg equivalent
        co2 = fuel * 2.2 # 2.2 kg CO2 per kg CNG
    else: # Diesel default
        fuel = distance_km * 0.38 * load_factor # Liters
        co2 = fuel * 2.68 # 2.68 kg CO2 per liter diesel
        
    cost = fuel * 1.5 if fuel > 0 else distance_km * 0.12 # cost estimation
    return round(fuel, 2), round(co2, 2), round(cost, 2)

def custom_vrp_solver(bins_list, vehicle_capacity, depot_lat, depot_lon):
    """
    Custom Capacitated VRP solver with bin priority weight.
    Orders bins by weight index (priority * fill_level) and performs a greedy
    Nearest-Neighbor search respecting vehicle capacity.
    """
    unvisited = [b for b in bins_list if b.get('fill_level', 0) > 0]
    # Sort unvisited initially by priority (descending) and fill level (descending)
    unvisited.sort(key=lambda x: (x.get('priority', 1) * 20 + x.get('fill_level', 0)), reverse=True)
    
    route = []
    current_lat = depot_lat
    current_lon = depot_lon
    current_load = 0.0
    total_dist = 0.0
    
    # Simple simulated grid graph using NetworkX for path check
    G = nx.Graph()
    
    while unvisited:
        # Find the nearest bin that fits in the truck
        best_candidate = None
        best_dist = float('inf')
        best_candidate_idx = -1
        
        for idx, bin_item in enumerate(unvisited):
            # Estimate bin waste weight (assume a max of 200kg per bin, scaled by fill_level)
            bin_weight = (bin_item.get('fill_level', 0) / 100.0) * 200.0
            
            if current_load + bin_weight <= vehicle_capacity:
                dist = haversine_distance(current_lat, current_lon, bin_item['latitude'], bin_item['longitude'])
                # Factor in priority: weight distance down for high priority bins
                priority_factor = 1.0 - (bin_item.get('priority', 1) - 1) * 0.12
                adjusted_dist = dist * max(0.4, priority_factor)
                
                if adjusted_dist < best_dist:
                    best_dist = adjusted_dist
                    best_candidate = bin_item
                    best_candidate_idx = idx
        
        if best_candidate:
            # We found a bin that fits
            bin_weight = (best_candidate.get('fill_level', 0) / 100.0) * 200.0
            bin_dist = haversine_distance(current_lat, current_lon, best_candidate['latitude'], best_candidate['longitude'])
            
            total_dist += bin_dist
            current_load += bin_weight
            
            # Record transition in Graph
            node_from = f"node_{len(route)}"
            node_to = f"bin_{best_candidate['id']}"
            G.add_edge(node_from, node_to, weight=bin_dist)
            
            route.append(best_candidate)
            current_lat = best_candidate['latitude']
            current_lon = best_candidate['longitude']
            unvisited.pop(best_candidate_idx)
        else:
            # No more bins fit. Must return to depot and empty load
            return_dist = haversine_distance(current_lat, current_lon, depot_lat, depot_lon)
            total_dist += return_dist
            
            # Reset truck
            current_lat = depot_lat
            current_lon = depot_lon
            current_load = 0.0
            
            # If no candidates fit at all even with empty truck (e.g. a single bin exceeds total capacity)
            # we force collect the highest priority bin to avoid deadlocks
            if len(unvisited) > 0 and current_load == 0.0:
                forced_bin = unvisited.pop(0)
                forced_dist = haversine_distance(current_lat, current_lon, forced_bin['latitude'], forced_bin['longitude'])
                total_dist += forced_dist
                route.append(forced_bin)
                current_lat = forced_bin['latitude']
                current_lon = forced_bin['longitude']
                
    # Return to depot at the end of route
    final_dist = haversine_distance(current_lat, current_lon, depot_lat, depot_lon)
    total_dist += final_dist
    
    return route, total_dist

def optimize_route(bins, vehicle, depot_lat=12.9716, depot_lon=77.5946):
    """
    Main route optimization function.
    Returns: {
        'route_order': List of bin dictionaries in order,
        'total_distance': float,
        'estimated_time': int,
        'fuel_consumption': float,
        'co2_emissions': float,
        'collection_cost': float,
        'path': List of [lat, lon] coordinate points
    }
    """
    if not bins:
        return {
            'route_order': [],
            'total_distance': 0.0,
            'estimated_time': 0,
            'fuel_consumption': 0.0,
            'co2_emissions': 0.0,
            'collection_cost': 0.0,
            'path': [[depot_lat, depot_lon]]
        }
        
    capacity = vehicle.get('capacity', 2000.0) # default 2000kg
    vehicle_type = vehicle.get('fuel_type', 'Diesel')
    
    # Run solver
    route_order = []
    total_dist = 0.0
    
    # Try using OR-Tools if available, otherwise fallback
    if OR_TOOLS_AVAILABLE:
        try:
            # We can formulate VRP using OR-Tools
            route_order, total_dist = solve_with_ortools(bins, capacity, depot_lat, depot_lon)
        except Exception as e:
            # Fallback on custom heuristic
            route_order, total_dist = custom_vrp_solver(bins, capacity, depot_lat, depot_lon)
    else:
        route_order, total_dist = custom_vrp_solver(bins, capacity, depot_lat, depot_lon)
        
    # Calculate path coordinates (depot -> bin1 -> bin2 -> ... -> depot)
    path = [[depot_lat, depot_lon]]
    for b in route_order:
        path.append([b['latitude'], b['longitude']])
    path.append([depot_lat, depot_lon])
    
    # Estimate time (average 30 km/h speed + 3 mins collection time per bin)
    avg_speed_kmh = 30.0
    travel_time_hours = total_dist / avg_speed_kmh
    collection_time_mins = len(route_order) * 3.5 # 3.5 mins per bin
    total_time_mins = int((travel_time_hours * 60) + collection_time_mins)
    
    # Calculate fuel & co2
    avg_fill = sum([b.get('fill_level', 0) for b in route_order]) / len(route_order) if route_order else 0.0
    fuel, co2, cost = calculate_fuel_and_co2(total_dist, vehicle_type, avg_fill)
    
    return {
        'route_order': route_order,
        'total_distance': round(total_dist, 2),
        'estimated_time': total_time_mins,
        'fuel_consumption': fuel,
        'co2_emissions': co2,
        'collection_cost': cost,
        'path': path
    }

def solve_with_ortools(bins, capacity, depot_lat, depot_lon):
    """Solve VRP using Google OR-Tools Routing Library."""
    # List of all locations: index 0 is depot, indices 1..N are bins
    locations = [{'latitude': depot_lat, 'longitude': depot_lon}] + bins
    num_locations = len(locations)
    
    # Distance Matrix (multiplied by 1000 to convert to integers for OR-Tools)
    distance_matrix = []
    for i in range(num_locations):
        row = []
        for j in range(num_locations):
            dist = haversine_distance(
                locations[i]['latitude'], locations[i]['longitude'],
                locations[j]['latitude'], locations[j]['longitude']
            )
            row.append(int(dist * 1000))
        distance_matrix.append(row)
        
    # Demand array: index 0 (depot) is 0, rest is estimated bin weight
    demands = [0]
    for b in bins:
        # weight = fill_level % of 200kg
        demands.append(int((b.get('fill_level', 0) / 100.0) * 200.0))
        
    # Create the routing index manager.
    # 1 vehicle, 1 depot (index 0)
    manager = pywrapcp.RoutingIndexManager(num_locations, 1, 0)
    routing = pywrapcp.RoutingModel(manager)
    
    # Create and register a transit callback.
    def distance_callback(from_index, to_index):
        # Convert from routing variable Index to distance matrix NodeIndex.
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]
        
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Add Capacity constraint.
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return demands[from_node]
        
    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        [int(capacity)],  # vehicle maximum capacities
        True,  # start cumul to zero
        'Capacity'
    )
    
    # Setting first solution heuristic.
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    
    # Solve the problem.
    solution = routing.SolveWithParameters(search_parameters)
    
    if solution:
        # Get route
        route_order = []
        index = routing.Start(0)
        total_dist_meters = 0
        
        while not routing.IsEnd(index):
            node_idx = manager.IndexToNode(index)
            if node_idx != 0: # Skip depot
                route_order.append(bins[node_idx - 1])
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            total_dist_meters += routing.GetArcCostForVehicle(previous_index, index, 0)
            
        return route_order, (total_dist_meters / 1000.0)
    else:
        # Fallback to custom VRP
        return custom_vrp_solver(bins, capacity, depot_lat, depot_lon)
