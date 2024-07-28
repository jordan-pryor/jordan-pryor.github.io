import { onMount } from "solid-js";
import * as d3 from "d3";

// Replace 'YOUR_GITHUB_USERNAME' with your actual GitHub username
const githubUsername = "jordan-pryor";

// Color palette
const colors = {
  nodeFill: "#ed8796", // Red
  nodeStroke: "#c6a0f6", // Mauve
  link: "#8bd5ca", // Teal
  label: "#cad3f5", // Text
  background: "#24273a" // Base
};

const NetworkGraph = () => {
  let graphContainer: HTMLDivElement | undefined;
  let activityContainer: HTMLDivElement | undefined;

  onMount(() => {
    if (!graphContainer || !activityContainer) return;

    const width = graphContainer.clientWidth;
    const height = 500;

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

    // Fetch GitHub user activity
    fetch(`https://api.github.com/users/${githubUsername}/events`)
      .then(response => response.json())
      .then(events => {
        const activityData = events.map(event => ({
          type: event.type,
          repo: event.repo.name,
          date: new Date(event.created_at)
        }));

        const activityWidth = activityContainer.clientWidth;
        const activityHeight = 300;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };

        const svgActivity = d3
          .select(activityContainer)
          .append("svg")
          .attr("width", activityWidth)
          .attr("height", activityHeight)
          .style("background-color", colors.background);

        const x = d3.scaleTime()
          .domain(d3.extent(activityData, d => d.date))
          .range([margin.left, activityWidth - margin.right]);

        const y = d3.scaleBand()
          .domain(activityData.map(d => d.type))
          .range([margin.top, activityHeight - margin.bottom])
          .padding(0.1);

        const xAxis = g => g
          .attr("transform", `translate(0,${activityHeight - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(activityWidth / 80).tickSizeOuter(0));

        const yAxis = g => g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .call(g => g.select(".domain").remove());

        svgActivity.append("g")
          .selectAll("rect")
          .data(activityData)
          .enter()
          .append("rect")
          .attr("x", d => x(d.date))
          .attr("y", d => y(d.type))
          .attr("width", 10)
          .attr("height", y.bandwidth())
          .attr("fill", colors.nodeFill);

        svgActivity.append("g").call(xAxis);
        svgActivity.append("g").call(yAxis);
      })
      .catch(error => console.error('Error fetching GitHub activity:', error));
  });

  return (
    <div class="flex flex-col text-white justify-center items-center w-full h-full">
      <div class="w-full" ref={el => (graphContainer = el)}></div>
      <div class="w-full" ref={el => (activityContainer = el)}></div>
    </div>
  );
};

export default NetworkGraph;

