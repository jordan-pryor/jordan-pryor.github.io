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
  let timelineContainer: HTMLDivElement | undefined;

  const drawTimeline = () => {
    if (!timelineContainer) return;

    const width = timelineContainer.clientWidth;
    const height = 200;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };

    const svg = d3
      .select(timelineContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background-color", colors.background);

    // Fetch GitHub user activity
    fetch(`https://api.github.com/users/${githubUsername}/events`)
      .then(response => response.json())
      .then(events => {
        const activityData = events.map(event => ({
          type: event.type,
          repo: event.repo.name,
          date: new Date(event.created_at)
        }));

        const x = d3.scaleTime()
          .domain(d3.extent(activityData, d => d.date))
          .range([margin.left, width - margin.right]);

        const y = d3.scaleBand()
          .domain(activityData.map(d => d.type))
          .range([margin.top, height - margin.bottom])
          .padding(0.1);

        const xAxis = g => g
          .attr("transform", `translate(0,${height - margin.bottom})`)
          .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

        const yAxis = g => g
          .attr("transform", `translate(${margin.left},0)`)
          .call(d3.axisLeft(y))
          .call(g => g.select(".domain").remove());

        svg.append("g")
          .selectAll("rect")
          .data(activityData)
          .enter()
          .append("rect")
          .attr("x", d => x(d.date))
          .attr("y", d => y(d.type))
          .attr("width", 10)
          .attr("height", y.bandwidth())
          .attr("fill", colors.nodeFill)
          .attr("opacity", 0)
          .transition()
          .duration(750)
          .attr("opacity", 1);

        svg.append("g").call(xAxis);
        svg.append("g").call(yAxis);
      })
      .catch(error => console.error('Error fetching GitHub activity:', error));
  };

  onMount(() => {
    drawTimeline();

    // Redraw the graph on window resize
    window.addEventListener("resize", () => {
      d3.select(timelineContainer).select("svg").remove();
      drawTimeline();
    });
  });

  return (
    <div class="flex flex-col text-white justify-center items-center w-full h-full">
      <div class="w-full" style="position: absolute; bottom: 0;" ref={el => (timelineContainer = el)}></div>
    </div>
  );
};

export default NetworkGraph;
