"""
Social Network Analysis (SNA) Engine
Builds a co-purchase/co-occurrence graph of medicines using NetworkX.
Two medicines are linked if they appear on the same date in the dataset.
Edge weight reflects co-occurrence frequency.
"""
import os
import pandas as pd
import networkx as nx
from itertools import combinations
from collections import defaultdict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "pharma_large_dataset.csv")


def build_copurchase_graph():
    """
    Build a weighted undirected co-purchase graph.
    Returns a dict with 'nodes' and 'edges' suitable for jsonification.
    """
    df = pd.read_csv(DATASET_PATH)
    df['Date'] = pd.to_datetime(df['Date'])

    # Group medicines by date — proxy for co-purchase basket
    baskets = df.groupby('Date')['Medicine'].apply(list)

    # Count co-occurrences
    co_counts = defaultdict(int)
    for basket in baskets:
        unique_meds = list(set(basket))
        if len(unique_meds) < 2:
            continue
        for pair in combinations(sorted(unique_meds), 2):
            co_counts[pair] += 1

    # Build NetworkX graph
    G = nx.Graph()

    # Add nodes with category attribute
    cat_map = df.groupby('Medicine')['Category'].first().to_dict()
    sales_map = df.groupby('Medicine')['Sales'].mean().round(1).to_dict()

    for med in df['Medicine'].unique():
        G.add_node(
            med,
            category=cat_map.get(med, 'General'),
            avg_sales=float(sales_map.get(med, 0))
        )

    # Add edges (filter weak connections — min threshold)
    max_count = max(co_counts.values()) if co_counts else 1
    for (m1, m2), count in co_counts.items():
        weight = round(count / max_count, 3)
        if weight >= 0.1:  # only meaningful edges
            G.add_edge(m1, m2, weight=weight, count=count)

    # Compute centrality for node sizing
    degree_centrality = nx.degree_centrality(G)

    # --- Serialize ---
    # Assign unique IDs for front-end
    node_list = list(G.nodes())
    node_id_map = {med: idx for idx, med in enumerate(node_list)}

    # Category color palette
    categories = list(set(cat_map.values()))
    cat_colors = {
        cat: f"hsl({i * 360 // len(categories)}, 70%, 60%)"
        for i, cat in enumerate(categories)
    }

    nodes = [
        {
            "id": node_id_map[med],
            "name": med,
            "category": cat_map.get(med, 'General'),
            "color": cat_colors.get(cat_map.get(med, 'General'), '#6ee7b7'),
            "val": round(degree_centrality.get(med, 0.1) * 20 + 3, 2),
            "avg_sales": float(sales_map.get(med, 0))
        }
        for med in node_list
    ]

    edges = [
        {
            "source": node_id_map[u],
            "target": node_id_map[v],
            "weight": data['weight'],
            "count": data['count']
        }
        for u, v, data in G.edges(data=True)
    ]

    # Top connected medicines (by degree)
    top_connected = sorted(
        [(med, G.degree(med)) for med in G.nodes()],
        key=lambda x: x[1], reverse=True
    )[:10]

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": G.number_of_nodes(),
            "total_edges": G.number_of_edges(),
            "top_connected": [{"name": m, "degree": d} for m, d in top_connected]
        }
    }
