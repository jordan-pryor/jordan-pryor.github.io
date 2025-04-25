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

// Function to calculate tile size based on repo name length
const baseTileHeight = 100; // Fixed height for all tiles

const githubUsername = "jordan-pryor"; // GitHub username for fetching repo data

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
            .attr("height", height)
            .style("background-color", "#24273a"); // Dark background for the canvas

        // Fetch repo data from GitHub API
        fetch(`https://api.github.com/users/${githubUsername}/repos`)
            .then((res) => res.json())
            .then((repos) => {
                // Nodes representing each repository (grid layout)
                const nodes = repos.map((repo: any, i: number) => ({
                    id: repo.name,
                    stars: repo.stargazers_count,
                    url: repo.html_url,
                    col: i % 5, // Column position in grid
                    row: Math.floor(i / 5), // Row position in grid
                    nameLength: repo.name.length, // Length of repo name for dynamic sizing
                }));

                // Function to determine the color based on the repo activity (stars)
                const getColorForActivity = (stars: number) => {
                    if (stars > 50) return colors.veryHighActivity;
                    if (stars > 30) return colors.highActivity;
                    if (stars > 10) return colors.mediumActivity;
                    if (stars > 0) return colors.lowActivity;
                    return colors.noActivity;
                };

                // Create the tiles for the grid
                svg
                    .selectAll("rect")
                    .data(nodes)
                    .enter()
                    .append("rect")
                    .attr("x", (d) => d.col * (baseTileHeight + 20)) // Column position with spacing
                    .attr("y", (d) => d.row * (baseTileHeight + 20)) // Row position with spacing
                    .attr("width", (d) => 120 + d.nameLength * 6) // Tile width based on name length
                    .attr("height", baseTileHeight) // Fixed height
                    .attr("fill", (d) => getColorForActivity(d.stars))
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1)
                    .style("cursor", "pointer")
                    .on("mouseover", function () {
                        d3.select(this).transition().duration(200).attr("transform", "scale(1.1)"); // Zoom effect on hover
                    })
                    .on("mouseout", function () {
                        d3.select(this).transition().duration(200).attr("transform", "scale(1)"); // Reset zoom
                    })
                    .on("click", (event, d) => {
                        window.open(d.url, "_blank");
                    });

                // Add repo names inside the tiles
                svg
                    .selectAll("text")
                    .data(nodes)
                    .enter()
                    .append("text")
                    .attr("class", "repo-label")
                    .attr("x", (d) => d.col * (baseTileHeight + 20) + (120 + d.nameLength * 6) / 2) // Centered text
                    .attr("y", (d) => d.row * (baseTileHeight + 20) + baseTileHeight / 2)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("fill", "#fff")
                    .attr("dy", "0.35em") // Vertical alignment of the text
                    .text((d) => d.id);
            })
            .catch((error) => console.error("Error fetching GitHub repos:", error));
    });

    return <div ref={graphContainer} style={{ width: "100%", height: "100%" }}></div>;
};

export default NetworkGraph;
