"""
Save LangGraph visualization as PNG
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from agent.agent import create_agent_graph

# Create graph
graph = create_agent_graph()

# Generate PNG
png_data = graph.get_graph().draw_mermaid_png()

# Save file
output_path = "research_agent_graph.png"

with open(output_path, "wb") as f:
    f.write(png_data)

print(f"Graph saved as: {output_path}")