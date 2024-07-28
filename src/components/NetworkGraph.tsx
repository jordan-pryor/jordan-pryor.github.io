import { onMount } from "solid-js";
import * as d3 from "d3";

// Replace 'YOUR_GITHUB_USERNAME' with your actual GitHub username
const githubUsername = "jordan-pryor";
const githubOrg = "fifthcirclestudios"; // Replace with your organization name

const colors = {
  nodeFill: "#ed8796", // Red
  nodeStroke: "#c6a0f6", // Mauve
  link: "#8bd5ca", // Teal
  label: "#cad3f5", // Text
  background: "#24273a", // Base
  noActivity: "#363a4f", // Background
  lowActivity: "#8bd5ca", // Teal
  mediumActivity: "#f5bde6", // Pink
  highActivity: "#ed8796", // Red
  veryHighActivity: "#f5a97f" // Peach
};

// Color key mapping
const colorKey = [
  { label: "No Activity", color: colors.noActivity },
  { label: "Low Activity", color: colors.lowActivity },
  { label: "Medium Activity", color: colors.mediumActivity },
  { label: "High Activity", color: colors.highActivity },
  { label: "Very High Activity", color: colors.veryHighActivity }
];

// Function to calculate luminance
const getLuminance = (hex: string) => {
  const rgb = parseInt(hex.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >>  8) & 0xff) / 255;
  const b = ((rgb >>  0) & 0xff) / 255;
  
  const a = [r, g, b].map(value => {
    value = value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    return value;
  });
  
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

// Function to determine text color
const getTextColor = (bgColor: string) => {
  return getLuminance(bgColor) > 0.5 ? "#000" : "#fff";
};

const NetworkGraph = () => {
  let graphContainer: HTMLDivElement | undefined;

  onMount(() => {
    if (!graphContainer) return;

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

    // Fetch GitHub events
    fetch(`https://api.github.com/users/${githubUsername}/events`)
      .then(response => response.json())
      .then(events => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        const activityCounts = Array.from({ length: 5 }, () => Array(31).fill(0));
        
        events.forEach(event => {
          const eventDate = new Date(event.created_at);
          if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
            const day = eventDate.getDate() - 1;
            const activityLevel = event.type === "PushEvent" ? 4 : 
                                  event.type === "PullRequestEvent" ? 3 : 
                                  event.type === "IssueCommentEvent" ? 2 : 1;
            activityCounts[activityLevel - 1][day]++;
          }
        });

        const blockWidth = (width - 40) / 31; // Adjust for padding
        const blockHeight = 100;
        const barWidth = (width - 40) / 5;

        const blockGraphContainer = d3.select(graphContainer).append("div")
          .style("position", "relative")
          .style("width", "100%")
          .style("height", `${blockHeight}px`)
          .style("margin-top", "10px");

        const svgBlocks = d3.select(blockGraphContainer.node())
          .append("svg")
          .attr("width", width - 40)
          .attr("height", blockHeight)
          .style("background-color", colors.background);

        svgBlocks.selectAll("rect")
          .data(activityCounts.flatMap((activity, i) => activity.map((count, j) => ({ x: j * blockWidth, y: i * (blockHeight / 5), width: blockWidth, height: blockHeight / 5, color: count > 0 ? colors.lowActivity : colors.noActivity }))))
          .enter()
          .append("rect")
          .attr("x", d => d.x)
          .attr("y", d => d.y)
          .attr("width", d => d.width)
          .attr("height", d => d.height)
          .attr("fill", d => d.color)
          .attr("stroke", "#000")
          .attr("stroke-width", 0.5)
          .on("mouseover", function() {
            d3.select(this).attr("stroke", "#fff");
          })
          .on("mouseout", function() {
            d3.select(this).attr("stroke", "#000");
          });

        const xAxisScale = d3.scaleLinear()
          .domain([0, 30])
          .range([0, width - 40]);

        const yAxisScale = d3.scaleLinear()
          .domain([0, 4])
          .range([blockHeight, 0]);

        const xAxis = d3.axisBottom(xAxisScale)
          .ticks(31)
          .tickSize(0);

        const yAxis = d3.axisLeft(yAxisScale)
          .ticks(5)
          .tickSize(0);

        svgBlocks.append("g")
          .attr("class", "x axis")
          .attr("transform", `translate(0,${blockHeight - 20})`)
          .call(xAxis)
          .selectAll("text")
          .attr("fill", colors.label)
          .style("font-size", "10px");

        svgBlocks.append("g")
          .attr("class", "y axis")
          .attr("transform", `translate(20,0)`)
          .call(yAxis)
          .selectAll("text")
          .attr("fill", colors.label)
          .style("font-size", "10px");

        const colorKeySvg = d3.select(graphContainer).append("svg")
          .attr("width", width - 40)
          .attr("height", 60)
          .style("background-color", colors.background)
          .style("margin-top", "10px");

        colorKeySvg.selectAll("rect")
          .data(colorKey)
          .enter()
          .append("rect")
          .attr("x", (d, i) => i * 120 + 20)
          .attr("y", 10)
          .attr("width", 100)
          .attr("height", 30)
          .attr("fill", d => d.color)
          .attr("stroke", "#000")
          .attr("stroke-width", 0.5);

        colorKeySvg.selectAll("text")
          .data(colorKey)
          .enter()
          .append("text")
          .attr("x", (d, i) => i * 120 + 30)
          .attr("y", 35)
          .attr("fill", d => getTextColor(d.color))
          .text(d => d.label)
          .style("font-size", "12px");
      })
      .catch(error => console.error('Error fetching GitHub events:', error));
  });

  return <div ref={graphContainer} style={{ position: "relative", width: "100%", height: "auto" }}></div>;
};

export default NetworkGraph;
