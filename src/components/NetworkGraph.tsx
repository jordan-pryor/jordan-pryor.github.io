import { onMount } from "solid-js";
import * as d3 from "d3";

// Replace 'YOUR_GITHUB_USERNAME' with your actual GitHub username
const githubUsername = "jordan-pryor";
const githubOrg = "example-org"; // Replace with your organization name

// Color palette
const colors = {
  nodeFill: "#ed8796", // Red
  nodeStroke: "#c6a0f6", // Mauve
  link: "#8bd5ca", // Teal
  label: "#cad3f5", // Text
  background: "#24273a", // Base
  activityLow: "#a6da95", // Green
  activityMedium: "#eed49f", // Yellow
  activityHigh: "#f5a97f" // Peach
};

const NetworkGraph = () => {
  let graphContainer: HTMLDivElement | undefined;
  let blockGraphContainer: HTMLDivElement | undefined;

  onMount(() => {
    if (!graphContainer || !blockGraphContainer) return;

    const width = graphContainer.clientWidth;
    const height = 500;

    // Network Graph
    const svg = d3
      .select(graphContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background-color", colors.background);

    // Fetch GitHub repositories
    fetch(`https://api.github.com/users/${githubUsername}/repos`)
      .then(response => response.json())
      .then(repos => {
        const nodes = repos.map(repo => ({ id: repo.name, url: repo.html_url }));
        const links = nodes.map((node, index) => ({
          source: index === 0 ? nodes[0].id : nodes[Math.floor(Math.random() * index)].id,
          target: node.id
        }));

        const simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(links).id(d => d.id).distance(100))
          .force("charge", d3.forceManyBody().strength(-200))
          .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
          .attr("class", "links")
          .selectAll("line")
          .data(links)
          .enter()
          .append("line")
          .attr("stroke", colors.link)
          .attr("stroke-width", 2);

        const node = svg.append("g")
          .attr("class", "nodes")
          .selectAll("circle")
          .data(nodes)
          .enter()
          .append("circle")
          .attr("r", 10)
          .attr("fill", colors.nodeFill)
          .attr("stroke", colors.nodeStroke)
          .attr("stroke-width", 1.5)
          .on("click", (event, d) => {
            window.open(d.url, "_blank");
          })
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
          .attr("dx", 12)
          .text(d => d.id)
          .attr("fill", colors.label);

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

    // Block Graph
    const blockGraphWidth = width;
    const blockGraphHeight = 100;
    const daysInMonth = 30;

    const blockSvg = d3
      .select(blockGraphContainer)
      .append("svg")
      .attr("width", blockGraphWidth)
      .attr("height", blockGraphHeight)
      .style("background-color", colors.background);

    const colorScale = d3.scaleLinear()
      .domain([0, 50, 100]) // Replace these values with your own activity thresholds
      .range([colors.activityLow, colors.activityMedium, colors.activityHigh]);

    // Fetch activity data
    fetch(`https://api.github.com/users/${githubUsername}/events`)
      .then(response => response.json())
      .then(events => {
        const activityData = Array(daysInMonth).fill(0);

        events.forEach(event => {
          const date = new Date(event.created_at);
          const day = date.getDate();
          if (day > 0 && day <= daysInMonth) {
            activityData[day - 1]++;
          }
        });

        const blockWidth = blockGraphWidth / daysInMonth;
        const blockHeight = blockGraphHeight;

        blockSvg.selectAll("rect")
          .data(activityData)
          .enter()
          .append("rect")
          .attr("x", (d, i) => i * blockWidth)
          .attr("y", 0)
          .attr("width", blockWidth)
          .attr("height", blockHeight)
          .attr("fill", d => colorScale(d))
          .on("mouseover", (event, d) => {
            d3.select(event.currentTarget)
              .attr("stroke", "#fff")
              .attr("stroke-width", 1.5);
          })
          .on("mouseout", (event, d) => {
            d3.select(event.currentTarget)
              .attr("stroke", "none");
          });

        // Add a legend
        const legend = blockSvg.append("g")
          .attr("transform", `translate(${blockGraphWidth - 120}, 10)`);

        const legendWidth = 20;
        const legendHeight = 60;

        legend.selectAll("rect")
          .data([0, 50, 100])
          .enter()
          .append("rect")
          .attr("x", 0)
          .attr("y", (d, i) => i * (legendHeight / 3))
          .attr("width", legendWidth)
          .attr("height", legendHeight / 3)
          .attr("fill", d => colorScale(d))
          .attr("stroke", "#000");

        legend.selectAll("text")
          .data([0, 50, 100])
          .enter()
          .append("text")
          .attr("x", legendWidth + 5)
          .attr("y", (d, i) => i * (legendHeight / 3) + (legendHeight / 6))
          .text(d => `${d}`)
          .attr("fill", "#fff")
          .style("font-size", "12px");
      })
      .catch(error => console.error('Error fetching GitHub events:', error));
  });

  return (
    <div class="flex flex-col text-white justify-center items-center w-full h-full">
      <div class="w-full" ref={graphContainer}></div>
      <div class="w-full" ref={blockGraphContainer}></div>
    </div>
  );
};

export default NetworkGraph;
