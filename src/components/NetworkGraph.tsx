import { onMount } from "solid-js";
import * as d3 from "d3";

const githubUsername = "jordan-pryor";

const colors = {
    tileStroke: "#b9a0f2",
    background: "#1e2030",
    text: "#ffffff", // better contrast
    activityColors: d3.scaleLinear<string>()
        .domain([0, 50])
        .range(["#8aadf4", "#f5bde6"]),
};

const hexRadius = 40;

const hexToPixel = (q: number, r: number) => {
    const spacing = 1.25; // adjust spacing between tiles
    const x = hexRadius * Math.sqrt(3) * (q + r / 2) * spacing;
    const y = hexRadius * 1.5 * r * spacing;
    return [x, y];
};

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
            .style("background-color", colors.background);

        fetch(`https://api.github.com/users/${githubUsername}/repos`)
            .then(res => res.json())
            .then(repos => {
                const nodes = repos.map((repo: any, i: number) => ({
                    id: repo.name,
                    url: repo.html_url,
                    stars: repo.stargazers_count,
                    q: (i % 5) - 2,
                    r: Math.floor(i / 5) - 1,
                }));

                const tileGroup = svg.append("g")
                    .attr("transform", `translate(${width / 2}, ${height / 2})`);

                // Draw hex tiles
                tileGroup.selectAll("polygon")
                    .data(nodes)
                    .enter()
                    .append("polygon")
                    .attr("points", () => {
                        return d3.range(6).map(i => {
                            const angle = Math.PI / 3 * i;
                            const x = hexRadius * Math.cos(angle);
                            const y = hexRadius * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(" ");
                    })
                    .attr("transform", d => {
                        const [x, y] = hexToPixel(d.q, d.r);
                        return `translate(${x}, ${y})`;
                    })
                    .attr("fill", d => colors.activityColors(d.stars))
                    .attr("stroke", colors.tileStroke)
                    .attr("stroke-width", 1.5)
                    .on("mouseover", function () {
                        d3.select(this).attr("fill", "#f5a97f");
                    })
                    .on("mouseout", function (event, d: any) {
                        d3.select(this).attr("fill", colors.activityColors(d.stars));
                    })
                    .on("click", (event, d) => {
                        window.open(d.url, "_blank");
                    });

                // Add labels *above* hex tiles
                tileGroup.selectAll("text")
                    .data(nodes)
                    .enter()
                    .append("text")
                    .attr("transform", d => {
                        const [x, y] = hexToPixel(d.q, d.r);
                        return `translate(${x}, ${y - hexRadius - 8})`;
                    })
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px")
                    .attr("fill", colors.text)
                    .text(d => d.id);
            });
    });

    return <div ref={graphContainer} style={{ width: "100%", height: "auto" }}></div>;
};

export default NetworkGraph;
