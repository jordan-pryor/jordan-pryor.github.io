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
  activityHigh: "#f5a97f", // Peach
  noActivity: "#24273a" // Match the background color
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
          .attr("stroke-width", 2)
          .attr("opacity", 0.6)
          .on("mouseover", function() {
            d3.select(this)
              .attr("stroke-width", 4)
              .attr("opacity", 1);
          })
          .on("mouseout", function() {
            d3.select(this)
              .attr("stroke-width", 2)
              .attr("opacity", 0.6);
          });

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
          .on("mouseover", function() {
            d3.select(this)
              .attr("r", 15)
              .attr("fill", "#fff")
              .attr("stroke", "#000");
          })
          .on("mouseout", function() {
            d3.select(this)
              .attr("r", 10)
              .attr("fill", colors.nodeFill)
              .attr("stroke", colors.nodeStroke);
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
    const blockGraphWidth = width * 0.8; // Adjusted width to fit within the screen
    const blockGraphHeight = 150; // Adjusted height for visibility
    const daysInMonth = 30;
    const blocksPerRow = 5;

    const blockSvg = d3
      .select(blockGraphContainer)
      .append("svg")
      .attr("width", blockGraphWidth)
      .attr("height", blockGraphHeight)
      .style("background-color", colors.background);

    // Color scale for activity levels
    const colorScale = d3.scaleLinear()
      .domain([0, 10, 20]) // Adjust these values based on your activity data
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

        const blockWidth = blockGraphWidth / (daysInMonth / blocksPerRow);
        const blockHeight = blockGraphHeight / blocksPerRow;

        blockSvg.selectAll("rect")
          .data(activityData)
          .enter()
          .append("rect")
          .attr("x", (d, i) => (i % (daysInMonth / blocksPerRow)) * blockWidth)
          .attr("y", (d, i) => Math.floor(i / (daysInMonth / blocksPerRow)) * blockHeight)
          .attr("width", blockWidth - 1) // Adjust to fit within the grid
          .attr("height", blockHeight - 1)
          .attr("fill", d => d === 0 ? colors.noActivity : colorScale(d))
          .attr("stroke", "#000")
          .attr("stroke-width", 0.5)
          .on("mouseover", (event, d) => {
            d3.select(event.currentTarget)
              .attr("stroke", "#fff")
              .attr("stroke-width", 1.5);
          })
          .on("mouseout", (event, d) => {
            d3.select(event.currentTarget)
              .attr("stroke", "#000")
              .attr("stroke-width", 0.5);
          });

        // Add labels for days and months
        const dayLabels = blockSvg.append("g")
          .attr("class", "day-labels");

        dayLabels.selectAll("text")
          .data(Array.from({ length: blocksPerRow }, (_, i) => i + 1))
          .enter()
          .append("text")
          .attr("x", (d, i) => i * blockWidth + blockWidth / 2)
          .attr("y", blockGraphHeight + 20)
          .text(d => `Day ${d}`)
          .attr("text-anchor", "middle")
          .attr("fill", colors.label);

        const monthLabel = blockSvg.append("text")
          .attr("x", blockGraphWidth / 2)
          .attr("y", blockGraphHeight + 40)
          .attr("text-anchor", "middle")
          .text("Month")
          .attr("fill", colors.label);
          })
      .catch(error => console.error('Error fetching GitHub events:', error));
  });

  return (
    <div class="flex flex-col text-white justify-center items-center w-full h-full">
      <div class="w-full" ref={graphContainer}></div>
      <div class="w-full flex justify-center items-center">
        <div
          class="relative"
          style={{
            width: '80%',
            height: '150px',
            backgroundColor: colors.background,
            margin: '0 auto',
          }}
          ref={blockGraphContainer}
        ></div>
      </div>
    </div>
  );
};

export default NetworkGraph;
