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
  let spiderWebContainer: HTMLDivElement | undefined;
  const [repos, setRepos] = createSignal([]);

  const drawSpiderWeb = () => {
    if (!spiderWebContainer) return;

    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = d3
      .select(spiderWebContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background-color", colors.background)
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Fetch GitHub user activity
    fetch(`https://api.github.com/users/${githubUsername}/events`)
      .then(response => response.json())
      .then(events => {
        const activityTypes = Array.from(new Set(events.map(event => event.type)));
        const angleSlice = (Math.PI * 2) / activityTypes.length;

        const radialScale = d3.scaleLinear()
          .domain([0, d3.max(events, d => new Date(d.created_at).getTime())])
          .range([0, radius]);

        const axis = svg.append("g").selectAll(".axis")
          .data(activityTypes)
          .enter()
          .append("g")
          .attr("class", "axis");

        axis.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", d => radialScale(new Date(events.find(e => e.type === d).created_at).getTime()))
          .attr("y2", 0)
          .attr("stroke", colors.nodeStroke);

        axis.append("text")
          .attr("x", d => radialScale(new Date(events.find(e => e.type === d).created_at).getTime()) + 5)
          .attr("y", 0)
          .attr("dy", "-0.3em")
          .attr("fill", colors.label)
          .text(d => d);

        svg.selectAll(".activity")
          .data(events)
          .enter()
          .append("circle")
          .attr("r", 4)
          .attr("cx", d => radialScale(new Date(d.created_at).getTime()) * Math.cos(angleSlice * activityTypes.indexOf(d.type)))
          .attr("cy", d => radialScale(new Date(d.created_at).getTime()) * Math.sin(angleSlice * activityTypes.indexOf(d.type)))
          .attr("fill", colors.nodeFill)
          .on("click", (event, d) => {
            window.open(d.repo.url, "_blank");
          });
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
    drawSpiderWeb();
    fetchRepos();

    // Redraw the graph on window resize
    window.addEventListener("resize", () => {
      d3.select(spiderWebContainer).select("svg").remove();
      drawSpiderWeb();
    });
  });

  return (
    <div class="flex flex-row text-white justify-center items-center w-full h-full">
      <div class="w-1/4 h-full" ref={el => (spiderWebContainer = el)}></div>
      <div class="w-3/4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
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
