import { onMount } from "solid-js";
import * as d3 from "d3";

// Color palette
const colors = {
  noActivity: "#363a4f", // Background
  lowActivity: "#8bd5ca", // Teal
  mediumActivity: "#f5bde6", // Pink
  highActivity: "#ed8796", // Red
  veryHighActivity: "#f5a97f" // Peach
};

const colorKey = [
  { label: "No Activity", color: colors.noActivity },
  { label: "Low Activity", color: colors.lowActivity },
  { label: "Medium Activity", color: colors.mediumActivity },
  { label: "High Activity", color: colors.highActivity },
  { label: "Very High Activity", color: colors.veryHighActivity }
];

const BlockGraph = () => {
  let blockGraphContainer: HTMLDivElement | undefined;

  onMount(() => {
    if (!blockGraphContainer) return;

    const width = blockGraphContainer.clientWidth;
    const height = 200;

    const svg = d3
      .select(blockGraphContainer)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("background-color", "#24273a"); // Base

    // Fetch GitHub events
    fetch(`https://api.github.com/users/jordan-pryor/events`)
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
                                  event.type === "IssueCommentEvent" ? 3 :
                                  event.type === "PullRequestReviewEvent" ? 2 :
                                  1;
            activityCounts[activityLevel][day]++;
          }
        });

        const blockWidth = (width - 40) / 31;
        const blockHeight = 20;

        const blocks = svg.append("g")
          .attr("class", "blocks")
          .selectAll("rect")
          .data(activityCounts.flatMap((counts, level) => 
            counts.map((count, day) => ({
              color: getColorForActivityLevel(level),
              x: day * blockWidth,
              y: height - (level + 1) * blockHeight,
              width: blockWidth,
              height: blockHeight
            }))
          ))
          .enter()
          .append("rect")
          .attr("x", d => d.x)
          .attr("y", d => d.y)
          .attr("width", d => d.width)
          .attr("height", d => d.height)
          .attr("fill", d => d.color)
          .on("mouseover", function() {
            d3.select(this).attr("fill", "#f5bde6");
          })
          .on("mouseout", function(d) {
            d3.select(this).attr("fill", d.color);
          });

        const xAxisScale = d3.scaleLinear()
          .domain([0, 31])
          .range([0, width - 40]);

        const yAxisScale = d3.scaleLinear()
          .domain([0, 5])
          .range([blockHeight, 0]);

        const xAxis = d3.axisBottom(xAxisScale)
          .ticks(31)
          .tickSize(0);

        const yAxis = d3.axisLeft(yAxisScale)
          .ticks(5)
          .tickSize(0);

        svg.append("g")
          .attr("class", "x axis")
          .attr("transform", `translate(0,${height - 20})`)
          .call(xAxis)
          .selectAll("text")
          .attr("fill", "#cad3f5") // Text
          .style("font-size", "10px");

        svg.append("g")
          .attr("class", "y axis")
          .attr("transform", `translate(20,0)`)
          .call(yAxis)
          .selectAll("text")
          .attr("fill", "#cad3f5") // Text
          .style("font-size", "10px");

        const colorKeySvg = d3.select(blockGraphContainer).append("svg")
          .attr("width", width - 40)
          .attr("height", 60)
          .style("background-color", "#24273a") // Base
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

  // Function to get color for activity level
  const getColorForActivityLevel = (level: number) => {
    switch (level) {
      case 4: return colors.veryHighActivity;
      case 3: return colors.highActivity;
      case 2: return colors.mediumActivity;
      case 1: return colors.lowActivity;
      default: return colors.noActivity;
    }
  };

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

  return <div ref={blockGraphContainer} style={{ position: "relative", width: "100%", height: "200px" }}></div>;
};

export default BlockGraph;
