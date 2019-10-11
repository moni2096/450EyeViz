//global variables
var mergedData;
//scales
var xScale, yScale, timeScale;
var rScale = d3.scaleLinear()
    .range([3,23]);
var colorScale = d3.scaleLinear()
    .range(['#0066ff', '#d0ff00', '#f00000'])
    .interpolate(d3.interpolateHcl);;
//svg
var svg, svgDiv, svgHeight, svgWidth;

//sliders
var timeSlider = d3.select('#timeRange');
var timeLabel = d3.select('#timeLabel');
function timeUpdate(val) {
    timeLabel.text(val+'s');
}
var durationSlider = d3.select('#durationSlider');
var pupilSlider = d3.select('#pupilSlider');



// Initial document setup
document.addEventListener('DOMContentLoaded', function(){
    
    //setting global vars and drawing csv
    svgDiv = document.getElementById("svgDiv");
    svgWidth = +svgDiv.offsetWidth;
    svgHeight = +svgDiv.offsetHeight;

    // TODO: make svg in index.html and adjust size
    svg = d3.select("#svgDiv")
        .append("svg")
        .attr("width", '100%')
        .attr("height", '100%')
        .attr("id", "drawnSvg");

    drawLegends();
    fetchCsvCallOthers();
});

// Fetches the csv, calls other functions
function fetchCsvCallOthers()
{
    var drawnSvg = document.getElementById("drawnSvg");
    //removing previously drawn circles
    if(drawnSvg != undefined) {
        d3.select('#svgDiv').selectAll("circle").remove();
    }
    var file = dataSetToLoad();
    d3.csv(file)
    .then(function(data){
        //converting all rows to int
        data.forEach(function(d) {
            d.time = +d.time;
            d.duration = +d.duration;
            d.x = +d.x;
            d.y = +d.y;
            d.avg_dilation = +d.avg_dilation;
        });
        mergedData = data;
        setScales(mergedData);  
        drawCircles(mergedData);
    });
}

// Returns file by checking which data set to load from radio buttons
function dataSetToLoad()
{
    if(document.getElementById("treeRadio").checked) {
        console.log('tree data');
        return "./data_preprocessed/merged_tree.csv";
    } else {
        console.log('graph data');
        return "./data_preprocessed/merged_graph.csv";
    }
}

// Sets the scales for x, y coordinates, duration and avg_dilation
function setScales(data)
{
    const xValue = d => d.x;
    const yValue = d => d.y;
    const durationValue = d => d.duration;   // plot size
    const pupilValue = d => d.avg_dilation;  // plot color
    const timeValue = d => d.time;

    var xMax = d3.max(data, xValue);
    var xMin = d3.min(data, xValue);
    console.log('x '+xMin+' : '+xMax);
    var yMax = d3.max(data, yValue);
    var yMin = d3.min(data, yValue);
    console.log('y '+yMin+' : '+yMax);
    var durationMax = d3.max(data, durationValue);
    var durationMin = d3.min(data, durationValue);
    console.log('duration '+durationMin+' : '+durationMax);
    var pupilMax = d3.max(data, pupilValue);
    var pupilMin = d3.min(data, pupilValue);
    console.log('pupil '+pupilMin+' : '+pupilMax);
    var timeMax = d3.max(data, timeValue);
    var timeMin = d3.min(data, timeValue);
    console.log('time '+timeMin+' : '+timeMax);

    xScale = d3.scaleLinear()
        .domain([0, xMax])
        .range([0+20, svgWidth-50])
        .nice();
    yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([0+20, svgHeight-50])
        .nice();
    rScale.domain([100, durationMax]).nice();
    colorScale.domain([0, 0.3, 1]);     //fixed with exagerated changes
        // .domain([0, (pupilMin+pupilMax)/2, pupilMax])   //show the distribution as it is
        // .domain([0, pupilMax*0.4, pupilMax])            //bit distorted
    timeScale = d3.scaleLinear()
        .domain([timeMin, timeMax])
        .range([0, 10])
        .nice();
        
    timeSlider.attr('max',timeMax/1000);    //set time slider range
}

// Draws circle points
function drawCircles(data)
{
    var tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltipDiv")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("");
        
    // Join data to circles
    var plots = svg.selectAll("circle")
        .data(data, function(d) { return d; }); //semantically join
    // Add circles
    plots.enter().append("circle")
        .attr("cx", d => xScale(d.x))
        .attr("cy", d => yScale(d.y))
        .attr("r", d => rScale(d.duration))
        .attr("fill", d => colorScale(d.avg_dilation))
        .attr("visibility","hidden")
        .on('mouseover', function(d, i) {
            const msg = "<b>time</b> " + (d.time/1000).toFixed(2) + "s <br>"
                      + "<b>duration</b> " + d.duration + "ms <br>"
                      + "<b>dilation</b> " + d.avg_dilation.toFixed(2) + "mm";
            tooltip.html(msg);
            tooltip.style("visibility", "visible");
            d3.select('#details').html(msg);
        })
        .on("mousemove", function(d, i) {
            return tooltip.style("top",
                (d3.event.pageY-10)+"px")
                    .style("left",(d3.event.pageX+10)+"px");
        })
        .on('mouseout', function(d, i){
            tooltip.style("visibility", "hidden");
            d3.select('#details').html('');
        })
        .transition()
        .delay(function(d, i){
            // console.log(d.time/1000);
            // timeSlider.attr('value',d.time/1000);
            // timeUpdate(d.time/1000);
            return timeScale(i*d.time);
        })
        .attr("visibility", "visible");
        // .transition().duration( (d,i) => {
        //     return timeScale(i*d.duration);
        // })
        // .attr('r', rScale(d.duration));

        // console.log('Drawing Done!');
}

// TODO: Filter with a range of values
// Filters plots by duration
function filterByDuration(val)
{
    var selected = +val*1000;
    var inclusiveVal = 250;
    var start = selected - inclusiveVal;
    var end = selected + inclusiveVal;
    console.log('filtering with fixation duration '
        +start+' ~ '+end+'ms');

    svg.selectAll('circle')
    // .transition().duration(500)  //it makes dynamic drawing stop
    // .ease(d3.easeLinear)
    .style('opacity', 0.05)
    .filter(function(d) {
        return (d.duration >= start) && (d.duration <= end);
    })
    .style('opacity', 0.9);

}

// Filters plots by pupil dilation
function filterByPupil(val)
{
    var selected = +val;
    var inclusiveVal = 0.125;
    var start = selected - inclusiveVal;
    var end = selected + inclusiveVal;
    console.log('filtering with pupil dilation '
        +start.toFixed(3)+' ~ '+end.toFixed(3)+'mm');

    svg.selectAll('circle')
    .style('opacity', 0.05)
    .filter(function(d) {
        return (d.avg_dilation >= start) && (d.avg_dilation <= end);
    })
    .style('opacity', 0.9);

}

// Removes filter effect when clicked on empty area
// $(document).on('click', function() { 
//     svg.selectAll('circle')
//     .style('opacity', 0.8);
// });

// Draws svg under legend sliders
function drawLegends()
{
    console.log('drawing svg under legends...');
    const sliderLength = 120;
    const gOffset = { x:25, y:25 };
    const scaleX = d3.scaleLinear().range([0, sliderLength]);

    // 1. Fixation Duration Legend
    const durationG = d3.select('#svgDurationSlider').append('g')
        .attr('transform',`translate(${gOffset.x},${gOffset.y})`);
    const durationSteps = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const durationStepTexts = [0, 0.5, 1, 1.5, 2];
    scaleX.domain([0, 2]);
    const scaleSize = rScale.domain([0, 2]);
    //back circles
    durationG.selectAll('circle')
        .data(durationSteps).enter().append('circle')
        .attr('cx', d => scaleX(d))
        .attr('r', d => scaleSize(d))  //the size legend
        .style('fill', '#CCC');
    //lines for the slider
    durationG.append('line').attr('x2',sliderLength);
    durationG.insert('g').attr('class','steps')
        .selectAll('circle')
        .data(durationStepTexts).enter().append('circle')
        .attr('cx', d=> scaleX(d));
    durationG.select('.steps').selectAll('text')
        .data([0,1,2]).enter().append('text')
        .attr('x', d=> scaleX(d))
        .attr('y', 18)  //how far the numbers away from line
        .text(d => {return d;});
    durationG.select('.steps').append('text')
        .attr('x', sliderLength+9).attr('y', 18)
        .text('s');

    // 2. Pupil Dilation Legend
    const pupilG = d3.select('#svgPupilSlider').append('g')
        .attr('transform',`translate(${gOffset.x},${gOffset.y})`);
    const pupilSteps = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    const pupilStepTexts = [0, 0.25, 0.5, 0.75, 1];
    scaleX.domain([0, 1]);
    const scaleColor = colorScale.domain([0, 0.3, 1]);
    //back circles
    pupilG.selectAll('circle')
        .data(pupilSteps).enter().append('circle')
        .attr('cx', d => scaleX(d))
        .attr('r', 14)
        .style('fill', d => scaleColor(d));  //the color legend
    //lines for the slider
    pupilG.append('line').attr('x2',sliderLength);
    pupilG.insert('g').attr('class','steps')
        .selectAll('circle')
        .data(pupilStepTexts).enter().append('circle')
        .attr('cx', d=> scaleX(d));
    pupilG.select('.steps').selectAll('text')
        .data([0,1]).enter().append('text')
        .attr('x', d=> scaleX(d))
        .attr('y', 25)  //how far the numbers away from line
        .text(d => {return d;});
    pupilG.select('.steps').append('text')
        .attr('x', sliderLength+15).attr('y', 25)
        .text('mm');

}