import { onMount } from "solid-js";
import * as d3 from "d3";

// Color palette for repo activity
const colors = {
    noActivity: "#282a36", // Base dark background
    lowActivity: "#8be9fd", // Soft light blue
    mediumActivity: "#ff79c6", // Soft pink
    highActivity: "#ff5555", // Bright red
    veryHighActivity: "#f1fa8c", // Soft yellow/peach
};

// Function to calculate hexagon center coordinates
const hexToPixel = (q: number, r: number) => {
    const hexRadius = 30; // size of the hexagon
    const x = hexRadius * Math.sqrt(3) * (q + r / 2);
    const y = hexRadius * 1.5 * r;
    return [x, y];
};

const githubUsername = "jordan-pryor"; // GitHub username for fetching repo data

const NetworkGraph = () => {
    let graphContainer: HTMLDivElement | undefined;

    onMount(() => {
        if (!graphContainer) return;

        const width = graphContainer.clientWidth;
        const height = 600;

        const svg = d3.select(graphContainer)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background-color", "#24273a"); // Dark background for the canvas

        // Fetch repo data from GitHub API
        fetch(`https://api.github.com/users/${githubUsername}/repos`)
            .then(res => res.json())
            .then(repos => {
                // Nodes representing each repository
                const nodes = repos.map((repo: any, i: number) => ({
                    id: repo.name,
                    stars: repo.stargazers_count,
                    url: repo.html_url,
                    q: i % 10 - 5,  // Positioning on the x-axis
                    r: Math.floor(i / 10) - 5, // Positioning on the y-axis
                }));

                // Function to determine the color based on the repo activity (stars)
                const getColorForActivity = (stars: number) => {
                    if (stars > 50) return colors.veryHighActivity;
                    if (stars > 30) return colors.highActivity;
                    if (stars > 10) return colors.mediumActivity;
                    if (stars > 0) return colors.lowActivity;
                    return colors.noActivity;
                };

                // Create a link between nodes
                const links = nodes.map((node, index) => ({
                    source: node,
                    target: nodes[(index + 1) % nodes.length] // Link each node to the next
                }));

                // Create the force simulation
                const simulation = d3.forceSimulation(nodes)
                    .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
                    .force("charge", d3.forceManyBody().strength(-100))
                    .force("center", d3.forceCenter(width / 2, height / 2));

                // Add hexagon shapes
                svg.selectAll("polygon")
                    .data(nodes)
                    .enter()
                    .append("polygon")
                    .attr("points", (d) => {
                        return d3.range(6).map(i => {
                            const angle = Math.PI / 3 * i;
                            const x = 30 * Math.cos(angle);
                            const y = 30 * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(" ");
                    })
                    .attr("transform", (d) => {
                        const [x, y] = hexToPixel(d.q, d.r);
                        return `translate(${x + width / 2}, ${y + height / 2})`;
                    })
                    .attr("fill", (d) => getColorForActivity(d.stars))
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1.5)
                    .on("mouseover", function () {
                        d3.select(this).attr("fill", "#f5bde6"); // Highlight color on hover
                    })
                    .on("mouseout", function (event, d) {
                        d3.select(this).attr("fill", getColorForActivity(d.stars));
                    })
                    .on("click", (event, d) => {
                        window.open(d.url, "_blank");
                    });

                // Add labels (repo names) above the hexagons
                svg.selectAll("text")
                    .data(nodes)
                    .enter()
                    .append("text")
                    .attr("transform", (d) => {
                        const [x, y] = hexToPixel(d.q, d.r);
                        return `translate(${x + width / 2}, ${y + height / 2 - 40})`; // Adjust position above the hexagon
                    })
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px")
                    .attr("fill", "#fff")
                    .text(d => d.id);

                // Add links to connect the hexagons (Spider-web effect)
                const link = svg.selectAll(".link")
                    .data(links)
                    .enter()
                    .append("line")
                    .attr("class", "link")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1);

                // Simulate movement of nodes and links
                simulation.on("tick", () => {
                    svg.selectAll("polygon")
                        .attr("transform", (d) => {
                            const [x, y] = hexToPixel(d.q, d.r);
                            return `translate(${d.x}, ${d.y})`;
                        });

                    link
                        .attr("x1", (d: any) => d.source.x)
                        .attr("y1", (d: any) => d.source.y)
                        .attr("x2", (d: any) => d.target.x)
                        .attr("y2", (d: any) => d.target.y);
                });

            })
            .catch(error => console.error('Error fetching GitHub repos:', error));
    });

    return <div ref={graphContainer} style={{ width: "100%", height: "auto" }}></div>;
};
export default NetworkGraph;
