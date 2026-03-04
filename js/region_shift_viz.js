
d3.csv("data/A2 Data.csv", row => {

    // console.log(row);
    let occurrence = parseInt(row["No. of abortions, by state of occurrence, 2020"].replace(/,/g, ""));
    let residence = parseInt(row["No. of abortions, by state of residence, 2020"].replace(/,/g, ""));

    if (!isNaN(occurrence) && !isNaN(residence)) {
        return {
            State: row["U.S. State"],
            Occurrence: occurrence,
            Residence: residence,
            NetFlow: occurrence - residence,
            AbsDiff: Math.abs(occurrence - residence)
        };
    }
}).then(data => {
    let filteredData = data.sort((a, b) => b.AbsDiff - a.AbsDiff)
        .slice(0, 15)
        .sort((a, b) => b.NetFlow - a.NetFlow); // top 15 states that have the biggest shift in abortions

    console.log(filteredData);

    const margin = {top: 60, right: 60, bottom: 60, left: 140},
        width = 800 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // scales
    const x = d3.scaleLinear()
        .domain(d3.extent(filteredData, d => d.NetFlow))
        .range([0, width])
        .nice();

    const y = d3.scaleBand()
        .range([0, height])
        .domain(filteredData.map(d => d.State))
        .padding(.2);

    // bars
    svg.selectAll("rect")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("x", d => x(Math.min(0, d.NetFlow)))
        .attr("y", d => y(d.State))
        .attr("width", d => Math.abs(x(d.NetFlow) - x(0)))
        .attr("height", y.bandwidth())
        .attr("fill", d => d.NetFlow > 0 ? "#2ca02c" : "#d62728")
        .attr("opacity", 0.85);

    // value labels
    svg.selectAll(".text")
        .data(filteredData)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("y", d => y(d.State) + y.bandwidth() / 2 + 4)
        .attr("x", d => d.NetFlow > 0 ? x(d.NetFlow) + 5 : x(d.NetFlow) - 5)
        .attr("text-anchor", d => d.NetFlow > 0 ? "start" : "end")
        .text(d => d.NetFlow.toLocaleString());

    // axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${x(0)},0)`)
        .call(d3.axisLeft(y).tickSize(0).tickPadding(10))
        .selectAll("text")
        .attr("text-anchor", d => {
            const val = filteredData.find(item => item.State === d).NetFlow;
            return val > 0 ? "end" : "start";
        })
        .attr("dx", d => {
            const val = filteredData.find(item => item.State === d).NetFlow;
            return val > 0 ? "-15px" : "30px";
        });

    // titles and text
    svg.append("line")
        .attr("x1", x(0))
        .attr("x2", x(0))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "black")
        .attr("stroke-width", 1.5);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("class", "title")
        .style("text-anchor", "middle")
        .text("Net Patient Flow by State (2020)");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("class", "axis-label")
        .style("text-anchor", "middle")
        .append("tspan")
        .text("Net Difference")
        .attr("x", width / 2)
        .append("tspan")
        .attr("x", width / 2)
        .attr("dy", "1.2em")
        .text("(Abortions by State Occurrence - Abortions by State Residence)");
})

