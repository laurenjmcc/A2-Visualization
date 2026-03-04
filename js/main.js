d3.csv("data/guttmacher.csv").then(data => {

    const parse = v => {
        if (!v || v.trim() === "unavailable" || v.trim() === "n/a" || v.trim() === "nr") return null;
        return parseFloat(v.replace(/[<,]/g, ""));
    };
    const KEEP = [
        "Missouri", "Rhode Island", "Louisiana", "Iowa", "Tennessee",
        "Connecticut", "Delaware", "Massachusetts", "Washington", "South Carolina"
    ];

    const rows = data.map(d => ({
        state:          d["U.S. State"]?.trim(),
        clinicChange:   parse(d["% change in the no. of abortion clinics, 2017-2020"]),
        abortionChange: parse(d["% change in abortion rate, 2017-2020"]),
    })).filter(d =>
        d.state &&
        d.clinicChange  !== null &&
        d.abortionChange !== null &&
        KEEP.includes(d.state)
    );

    rows.sort((a, b) => a.clinicChange - b.clinicChange);

    const X_MIN = -30;
    const X_MAX = 8;
    const margin = { top: 20, right: 230, bottom: 50, left: 140 };
    const rowH   = 32;
    const width  = 880;
    const height = rows.length * rowH + margin.top + margin.bottom;

    const svg = d3.select("#chart")
        .attr("width",  width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const innerW = width  - margin.left - margin.right;
    const innerH = height - margin.top  - margin.bottom;

    const x = d3.scaleLinear().domain([X_MIN, X_MAX]).range([0, innerW]);
    const y = d3.scaleBand()
        .domain(rows.map(d => d.state))
        .range([0, innerH])
        .padding(0.4);

    const clamp = v => Math.max(X_MIN, Math.min(X_MAX, v));
    const isClipped = v => v < X_MIN || v > X_MAX;

    g.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width",  x(0))
        .attr("height", innerH)
        .attr("fill", "#c0392b")
        .attr("opacity", 0.06);
    g.selectAll(".gridline")
        .data(x.ticks(6))
        .join("line")
        .attr("class", "gridline")
        .attr("x1", d => x(d)).attr("x2", d => x(d))
        .attr("y1", 0).attr("y2", innerH);
    g.append("line")
        .attr("class", "zero-line")
        .attr("x1", x(0)).attr("x2", x(0))
        .attr("y1", 0).attr("y2", innerH);
    g.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x)
            .ticks(6)
            .tickFormat(d => d + "%")
            .tickSize(4))
        .call(ax => ax.select(".domain").remove())
        .call(ax => ax.selectAll("text")
            .style("font-family", "'Source Serif 4', serif")
            .style("font-size",   "10px")
            .style("fill",        "#4a5568"));

    g.append("text")
        .attr("class", "axis-label")
        .attr("x", innerW / 2)
        .attr("y", innerH + 40)
        .attr("text-anchor", "middle")
        .text("Percentage change");
    g.selectAll(".state-label")
        .data(rows)
        .join("text")
        .attr("class", "state-label")
        .attr("x", -10)
        .attr("y", d => y(d.state) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => d.state)
        .style("font-weight", d => d.state === "Missouri" ? "700" : "300");

    g.selectAll(".lollipop-line")
        .data(rows)
        .join("line")
        .attr("class", "lollipop-line")
        .attr("x1", d => x(clamp(d.clinicChange)))
        .attr("x2", d => x(clamp(d.abortionChange)))
        .attr("y1", d => y(d.state) + y.bandwidth() / 2)
        .attr("y2", d => y(d.state) + y.bandwidth() / 2);
    const R = 6;
    rows.forEach(d => {
        const cx = x(clamp(d.clinicChange));
        const cy = y(d.state) + y.bandwidth() / 2;
        const clipped = isClipped(d.clinicChange);

        if (clipped) {
            const tri = d3.symbol().type(d3.symbolTriangle).size(60);
            g.append("path")
                .attr("d", tri)
                .attr("transform", `translate(${cx}, ${cy}) rotate(-90)`)
                .attr("fill", "#c0392b")
                .attr("opacity", 0.85);
        } else {
            g.append("circle")
                .attr("class", "dot-clinic-mark")
                .attr("cx", cx).attr("cy", cy).attr("r", R);
        }
    });
    rows.forEach(d => {
        const cx = x(clamp(d.abortionChange));
        const cy = y(d.state) + y.bandwidth() / 2;
        const clipped = isClipped(d.abortionChange);

        if (clipped) {
            const tri = d3.symbol().type(d3.symbolTriangle).size(60);
            g.append("path")
                .attr("d", tri)
                .attr("transform", `translate(${cx}, ${cy}) rotate(-90)`)
                .attr("fill", "#4a5568")
                .attr("opacity", 0.85);
        } else {
            g.append("circle")
                .attr("class", "dot-abortion-mark")
                .attr("cx", cx).attr("cy", cy).attr("r", R);
        }
    });
    const scRow = rows.find(d => d.state === "South Carolina");
    if (scRow) {
        g.append("text")
            .attr("x", x(clamp(scRow.abortionChange)) + 10)
            .attr("y", y("South Carolina") + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .style("font-family", "'Source Serif 4', serif")
            .style("font-size", "9.5px")
            .style("font-style", "italic")
            .style("fill", "#8b1a1a")
    }
    const moRow = rows.find(d => d.state === "Missouri");

    if (moRow) {
        const annoX = innerW + -90;
        const annoY = y("Missouri") + y.bandwidth() / 2 - 35;
        const annoW = 200;
        const annoH = 72;
        g.append("line")
            .attr("x1", x(X_MIN))
            .attr("x2", annoX)
            .attr("y1", y("Missouri") + y.bandwidth() / 2)
            .attr("y2", annoY + annoH / 2)
            .attr("stroke", "#8b1a1a")
            .attr("stroke-width", 0.8)
            .attr("stroke-dasharray", "3,3");

        g.append("rect")
            .attr("x", annoX).attr("y", annoY)
            .attr("width", annoW).attr("height", annoH)
            .attr("fill", "#1a1208");

        g.append("text")
            .attr("x", annoX + 10).attr("y", annoY + 19)
            .style("font-family", "'Playfair Display', serif")
            .style("font-size", "12px")
            .style("font-weight", "700")
            .style("fill", "#f5f0e8")
            .text("Missouri");

        const moLines = [
            "−67% of clinics closed.",
            "Abortion rate collapsed 98% —",
            "the sharpest drop in the nation."
        ];
        moLines.forEach((line, i) => {
            g.append("text")
                .attr("x", annoX + 10).attr("y", annoY + 36 + i * 13)
                .style("font-family", "'Source Serif 4', serif")
                .style("font-size", "10px")
                .style("font-style", "italic")
                .style("fill", "#c8b89a")
                .text(line);
        });
    }
    const natY = innerH + 58;

    g.append("line")
        .attr("x1", 0).attr("x2", innerW)
        .attr("y1", natY - 8).attr("y2", natY - 8)
        .attr("stroke", "#c8b89a")
        .attr("stroke-width", 0.5);

    g.append("text")
        .attr("x", 0).attr("y", natY + 4)
        .style("font-family", "'Source Serif 4', serif")
        .style("font-size", "9.5px")
        .style("font-style", "italic")
        .style("fill", "#8b1a1a");

    g.append("text")
        .attr("x", 0).attr("y", natY + 17)
        .style("font-family", "'Source Serif 4', serif")
        .style("font-size", "9px")
        .style("fill", "#a0aec0");

}).catch(err => {
    console.error("CSV load error:", err);
    document.getElementById("chart-container").innerHTML =
        `<p style="color:red;padding:20px">Could not load data/guttmacher.csv — check the file path.</p>`;
});