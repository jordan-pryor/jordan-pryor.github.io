import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// Replace 'YOUR_GITHUB_USERNAME' with your actual GitHub username
const githubUsername = 'jordan-pryor';

// Replace 'YOUR_ORG_NAME' with the actual GitHub organization name
const githubOrg = 'fifthcirclestudios';

// Define color palette
const colors = {
  nodeFill: '#ed8796', // Red
  nodeStroke: '#c6a0f6', // Mauve
  link: '#8bd5ca', // Teal
  label: '#cad3f5', // Text
  background: '#24273a' // Base
};

// Define color scale for block graph activity levels
const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 100]);

const NetworkGraph = () => {
  const [repoData, setRepoData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const graphContainer = useRef(null);

  useEffect(() => {
    // Fetch GitHub repositories
    fetch(`https://api.github.com/users/${githubUsername}/repos`)
      .then(response => response.json())
      .then(repos => {
        const nodes = repos.map(repo => ({ id: repo.name, url: repo.html_url }));
        const links = nodes.map((node, index) => ({
          source: index === 0 ? nodes[0].id : nodes[Math.floor(Math.random() * index)].id,
          target: node.id
        }));
        setRepoData({ nodes, links });

        createNetworkGraph(nodes, links);
      })
      .catch(error => console.error('Error fetching GitHub repos:', error));

    // Fetch GitHub organization activity data
    fetch(`https://api.github.com/orgs/${githubOrg}/repos`)
      .then(response => response.json())
      .then(repos => {
        const activity = Array.from({ length: 30 }, () => Math.floor(Math.random() * 100));
        setActivityData(activity);
        createBlockGraph(activity);
      })
      .catch(error => console.error('Error fetching GitHub org repos:', error));
  }, []);

  const createNetworkGraph = (nodes, links) => {
    if (!graphContainer.current) return;
    const width = graphContainer.current.clientWidth;
    const height = 500;

    const svg = d3.select(graphContainer.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background-color', colors.background);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', colors.link)
      .attr('stroke-width', 2);

    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('fill', colors.nodeFill)
      .attr('stroke', colors.nodeStroke)
      .attr('stroke-width', 1.5)
      .on('click', (event, d) => {
        window.open(d.url, '_blank');
      })
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    const labels = svg.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('dy', -3)
      .attr('dx', 12)
      .text(d => d.id)
      .attr('fill', colors.label);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      labels
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
  };

  const createBlockGraph = (data) => {
    const graphContainerElement = document.getElementById('block-graph');
    if (!graphContainerElement) return;

    const width = graphContainerElement.clientWidth;
    const height = 150;

    const svg = d3.select(graphContainerElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const blockWidth = width / 30;

    // Create blocks
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d, i) => i * blockWidth)
      .attr('y', d => height - d)
      .attr('width', blockWidth)
      .attr('height', d => d)
      .attr('fill', d => colorScale(d))
      .attr('stroke', '#000')
      .attr('stroke-width', 0.5)
      .on('mouseover', (event, d) => {
        d3.select(event.target)
          .attr('stroke-width', 2);
        d3.select('#block-tooltip')
          .style('visibility', 'visible')
          .text(`Activity: ${d}`);
      })
      .on('mousemove', (event) => {
        d3.select('#block-tooltip')
          .style('top', `${event.pageY}px`)
          .style('left', `${event.pageX + 10}px`);
      })
      .on('mouseout', (event) => {
        d3.select(event.target)
          .attr('stroke-width', 0.5);
        d3.select('#block-tooltip')
          .style('visibility', 'hidden');
      });

    // Add X Axis labels for dates
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(d3.scaleLinear().domain([0, 30]).range([0, width])).ticks(30).tickFormat((d, i) => i + 1));

    // Add tooltip
    d3.select('body').append('div')
      .attr('id', 'block-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', '#fff')
      .style('padding', '5px')
      .style('border-radius', '3px')
      .style('box-shadow', '0px 0px 6px rgba(0,0,0,0.1)');
  };

  return (
    <div className="relative flex flex-col text-white w-full h-screen bg-darkslate-700 p-4">
      <div className="relative w-full h-[500px] bg-darkslate-600 mb-8" ref={graphContainer}></div>
      <div className="relative flex flex-col text-white w-full h-[200px] bg-darkslate-700">
        <div id="block-graph" className="w-full h-full"></div>
        <div id="block-tooltip" className="tooltip"></div>
        <div className="absolute bottom-0 left-0 p-4">
          <div className="text-white font-bold">Activity Levels</div>
          <div className="flex">
            <div className="w-4 h-4 bg-[#440154] mx-1"></div><span>0%</span>
            <div className="w-4 h-4 bg-[#3b528b] mx-1"></div><span>20%</span>
            <div className="w-4 h-4 bg-[#21908d] mx-1"></div><span>40%</span>
            <div className="w-4 h-4 bg-[#5dc863] mx-1"></div><span>60%</span>
            <div className="w-4 h-4 bg-[#f8f800] mx-1"></div><span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default NetworkGraph;
