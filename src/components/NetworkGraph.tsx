import { onMount } from "solid-js";
import * as d3 from "d3";

const githubUsername = "jordan-pryor"; // Change as needed
const orgName = "fifthcirclestudios"; // Replace with your organization name

// Color palette
const colors = {
  nodeFill: "#ed8796", // Red
  nodeStroke: "#c6a0f6", // Mauve
  link: "#8bd5ca", // Teal
  label: "#cad3f5", // Text
  background: "#24273a", // Base
  blockColors: ["#8bd5ca", "#ed8796", "#c6a0f6", "#f5a97f", "#f0c6c6"], // Activity levels
  blockLabels: ["Low", "Moderate", "High", "Very High", "Extreme"]
};

const NetworkGraph = () => {
  let graphContainer: HTMLDivElement | undefined;
  let blockGraphContainer: HTMLDivElement | undefined;

  onMount(() => {
    if (!graphContainer || !blockGraphContainer) return;

    // Network Graph
    const width = graphContainer.clientWidth;
    const height = 500;

    const svg = d3
      .select(graphContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background-color", colors.background);

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

    // Block Graph for Activity
    const blockWidth = 60;
    const blockHeight = 30;
    const blockPadding = 10;

    const blockSvg = d3
      .select(blockGraphContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", blockHeight * 2 + blockPadding * 2);

    fetch(`https://api.github.com/orgs/${orgName}/repos`)
      .then(response => response.json())
      .then(repos => {
        const activityLevels = repos.reduce((acc, repo) => {
          // Example activity calculation (replace with actual logic)
          const activityLevel = Math.floor(Math.random() * colors.blockColors.length);
          if (!acc[activityLevel]) acc[activityLevel] = 0;
          acc[activityLevel]++;
          return acc;
        }, {});

        const blocks = Object.keys(activityLevels).map(level => ({
          level: parseInt(level),
          count: activityLevels[level]
        }));

        const blockGroup = blockSvg.append("g")
          .attr("transform", `translate(${blockPadding}, ${blockPadding})`);

        blockGroup.selectAll("rect")
          .data(blocks)
          .enter()
          .append("rect")
          .attr("x", (d, i) => i * (blockWidth + blockPadding))
          .attr("y", 0)
          .attr("width", blockWidth)
          .attr("height", blockHeight)
          .attr("fill", d => colors.blockColors[d.level])
          .attr("stroke", "#000")
          .attr("stroke-width", 1);

        blockGroup.selectAll("text")
          .data(blocks)
          .enter()
          .append("text")
          .attr("x", (d, i) => i * (blockWidth + blockPadding) + blockWidth / 2)
          .attr("y", blockHeight + 15)
          .attr("text-anchor", "middle")
          .attr("fill", "#fff")
          .text(d => d.count);

        // Add quick reference for colors
        const legend = blockSvg.append("g")
          .attr("transform", `translate(${blockPadding}, ${blockHeight * 2 + blockPadding * 2})`);

        colors.blockColors.forEach((color, index) => {
          legend.append("rect")
            .attr("x", 0)
            .attr("y", index * 20)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", color);

          legend.append("text")
            .attr("x", 30)
            .attr("y", index * 20 + 15)
            .attr("fill", "#fff")
            .text(colors.blockLabels[index]);
        });
      })
      .catch(error => console.error('Error fetching Org repos:', error));
  });

  return (
    <>
      <div class="flex flex-col text-white justify-center items-center w-full h-full">
        <div class="w-full" ref={graphContainer}></div>
        <div class="absolute bottom-0 left-0 w-full p-4" ref={blockGraphContainer}></div>
      </div>
    </>
  );
};

export default NetworkGraph;
