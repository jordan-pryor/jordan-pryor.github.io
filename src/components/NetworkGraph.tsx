import { onMount } from "solid-js";
import * as d3 from "d3";

// Replace 'YOUR_GITHUB_USERNAME' with your actual GitHub username
const githubUsername = "jordan-pryor";

const NetworkGraph = () => {
  let graphContainer: HTMLDivElement | undefined;

  onMount(() => {
    if (!graphContainer) return;

    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;

    const svg = d3
      .select(graphContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Fetch GitHub repositories
    fetch(`https://api.github.com/users/${githubUsername}/repos`)
      .then(response => response.json())
      .then(repos => {
        const nodes = repos.map(repo => ({ id: repo.name }));
        const links = nodes.map((node, index) => ({
          source: index === 0 ? nodes[0].id : nodes[Math.floor(Math.random() * index)].id,
          target: node.id
        }));

        const simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(links).id(d => d.id).distance(50))
          .force("charge", d3.forceManyBody().strength(-100))
          .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
          .attr("class", "links")
          .selectAll("line")
          .data(links)
          .enter()
          .append("line")
          .attr("stroke", "#999")
          .attr("stroke-width", 1);

        const node = svg.append("g")
          .attr("class", "nodes")
          .selectAll("circle")
          .data(nodes)
          .enter()
          .append("circle")
          .attr("r", 5)
          .attr("fill", "#E63946")
          .call(d3.drag()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            }));

        const labels = svg.append("g")
          .attr("class", "labels")
          .selectAll("text")
          .data(nodes)
          .enter()
          .append("text")
          .attr("class", "label")
          .attr("dy", -3)
          .attr("dx", 7)
          .text(d => d.id)
          .attr("fill", "#fff");

        simulation.on("tick", () => {
          link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

          node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

          labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
        });
      })
      .catch(error => console.error('Error fetching GitHub repos:', error));
  });

  return (
    <div class="w-full h-full" ref={graphContainer}></div>
  );
};

export default NetworkGraph;
