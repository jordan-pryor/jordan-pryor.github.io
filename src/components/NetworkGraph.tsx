import { onMount, createSignal } from "solid-js";
import * as d3 from "d3";

// Replace 'YOUR_GITHUB_USERNAME' and 'YOUR_ORG_NAME' with your actual GitHub username and organization name
const githubUsername = "jordan-pryor";
const githubOrg = "fifthcirclestudios";

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
  const [repos, setRepos] = createSignal([]);

  const drawTimeline = () => {
    if (!timelineContainer) return;

    const width = 150;
    const height = timelineContainer.clientHeight;
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

  const fetchRepos = async () => {
    try {
      const userRepos = await fetch(`https://api.github.com/users/${githubUsername}/repos`).then(res => res.json());
      const orgRepos = await fetch(`https://api.github.com/orgs/${githubOrg}/repos`).then(res => res.json());
      setRepos([...userRepos, ...orgRepos]);
    } catch (error) {
      console.error('Error fetching GitHub repos:', error);
    }
  };

  onMount(() => {
    drawTimeline();
    fetchRepos();

    // Redraw the graph on window resize
    window.addEventListener("resize", () => {
      d3.select(timelineContainer).select("svg").remove();
      drawTimeline();
    });
  });

  return (
    <div class="flex flex-row text-white justify-center items-center w-full h-full">
      <div class="w-1/5 h-full" ref={el => (timelineContainer = el)}></div>
      <div class="w-4/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {repos().map(repo => (
          <div class="bg-darkslate-500 p-4 rounded-lg shadow-lg">
            <a href={repo.html_url} target="_blank" class="text-xl font-bold text-white hover:underline">
              {repo.name}
            </a>
            <p class="text-gray-300">{repo.description}</p>
            <p class="text-gray-400 text-sm">{repo.language}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkGraph;
