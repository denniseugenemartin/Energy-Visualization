const canvas = d3.select(".canva");
const svg = d3.select(".visual");


// Margins of area
const margin = {top: 20, right: 20, bottom: 20, left: 20};

// Spacing in between individual nodes
const padding = 3;

// Color scale for nodes
const mColors = d3.scaleOrdinal(["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"])

// Will be used to determine what data to return when parsing csv file.    
parameter = null;
filter = null;

// Intro text directs user to filter options on page
svg.append("text")
.attr("id", "introText")
.text("Please make a selection from the top right menu.")
.attr("x", (getWidth(svgcanvas)/2) - 150)
.attr("y", getHeight(svgcanvas)/2)

// Layout functions that will calculate size of parent container so that svg elements will scale in size in 
// relation to available space in unison with resize function.
function getHeight(container)
{
    return ((container.clientHeight) - margin.top - margin.bottom);
}

function getWidth(container)
{
    return ((container.clientWidth) - margin.left - margin.right);
}

function getMaxRadius(container)
{
    return (getHeight(container) * getWidth(container) /30000)
}

// Main canvas grouping of svg elements.
const mainCanvas = svg.append("g")
                        .attr("width", getWidth(svgcanvas))
                        .attr("height", getHeight(svgcanvas))
                        .attr("transform", `translate(${margin.left},
                            ${margin.top})`)
                        
// Setting for tooltip display.
var Tooltip= d3.select("body")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "palegoldenrod")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

// Parse CSV file and fill two dropdown elements. One will be the year column of the CSV file and will be put into a set to remove duplicate entries and sorted. The other will be for 
// the country field and will be processed similarly.      
function populateDD()
{  
    var dataCsv = d3.csv(csv);

    dataCsv.then(function (data) {
        var yearOptions = [...new Set(data.map(d => d.Year))];
        var countryOptions = [...new Set(data.map(d => d.Country))];
        yearOptions.sort(); 
        countryOptions.sort();

    // When user selects a year from the yearSelector dropdown, it will set the paramter and filter variables. These are saved outside of the function itself in case a window
    // resize event is called, it can redisplay the same information without the user having to click another option. When user clicks it will also disable the tutorial text.
    d3.select('#yearSelector')
                .selectAll('option')
                .data(yearOptions)
                .join('option')
                .text(d => d)
                .attr('value', d => d)
                .on("click", function(d){
                    const introText = document.getElementById("introText");
                    introText.innerHTML = "";
                    filter = d3.select(this).property("value")
                    parameter = "year";
                    getCSVData(parameter, filter)
                })
                // .style("max-height", getHeight(svgcanvas));       

    // When user selects a year from the countrySelector dropdown, it will set the paramter and filter variables. These are saved outside of the function itself in case a window
    // resize event is called, it can redisplay the same information without the user having to click another option. When user clicks it will also disable the tutorial text.            
    d3.select('#countrySelector')
            .append("option")
            .selectAll('option')
            .data(countryOptions)
            .join()
            .append('option')
            .text(d => d)
            .attr('value', d => d)
            .on("click", function(d){
                const introText = document.getElementById("introText");
                introText.innerHTML = "";
                filter = d3.select(this).property("value")
                parameter = "country";
                getCSVData(parameter, filter)
            })
            .style("max-height", getHeight(svgcanvas));       
            });
}

// Will return data from CSV from either the year or country column depending on which the user selected in the dropdown box. Information will be passed to a data node
// and then to a d3 simulation.
function getCSVData(parameter, filter)
{

    d3.csv
    (csv, function (d)
        {
            if (parameter == "year")
            {
                if (d.Year == filter && d.Commodity == energy)
                {
                    return d;
                }
            }

            else if (parameter == "country")
            {
                if (d.Country == filter && d.Commodity == energy)
                {
                    return d;
                }
            }
            
        }
    ).then(function(data)
         {
            var radiusScale = d3.scaleLinear()
                                .domain(d3.extent(data, d => +d.Quantity))
                                .range([2, getMaxRadius(svgcanvas)]);

            var nodes = d3.range(data.length)
                            .map(function (d) 
                            {
                                r = radiusScale(data[d].Quantity);
                                d = 
                                {
                                    radius: r,
                                    country: data[d].Country,
                                    commodity: data[d].Commodity,
                                    unit: data[d].Unit,
                                    quantity: data[d].Quantity,
                                    year: data[d].Year,
                                    x: Math.cos(d / data.length * 2 * Math.PI) * 200 + getWidth(svgcanvas) / 2 + Math.random(),
                                    y: Math.sin(d / data.length * 2 * Math.PI) * 200 + getHeight(svgcanvas) / 2 + Math.random(),
                                };

                                return d;
                            });
                                
                            
                            var simulation = d3.forceSimulation(nodes)
                                            
                                            // Balance entire simulation around center of screen
                                            .force("center", d3.forceCenter(getWidth(svgcanvas) / 2, getHeight(svgcanvas) / 2))
                                         
                                            // Cluster by section
                                            .force("charge", d3.forceManyBody().strength(-5))

                                            // Apply collision with padding                                                                            
                                            .force("collision", d3.forceCollide(d => d.radius + padding)
                                                .strength(1))
                                            
                                            .force("x", d3.forceX().strength(.03).x(getWidth(svgcanvas) / 2))

                                            .force("y", d3.forceY().strength(.03).y( getHeight(svgcanvas)/2 ))  
                                            
                                            .on("tick", ticked)

                                        
                            //  What happens when a circle is dragged?
                            function dragstarted(event, d) {
                                if (!event.active) simulation.alphaTarget(.03).restart();
                                d.fx = d.x;
                                d.fy = d.y;
                            }
                            function dragged(event, d) {
                                d.fx = event.x;
                                d.fy = event.y;
                            }
                            function dragended(event, d) {
                                if (!event.active) simulation.alphaTarget(.07);
                                d.fx = null;
                                d.fy = null;
                            }
                            
                            // Three function that change the tooltip when user hover / move / leave a cell.
                            var mouseover = function(e,d) {
                                Tooltip
                                .style("opacity", 1)
                                d3.select(this)
                                .style("stroke", "black")
                                .style("opacity", 1)
                            }
                            var mousemove = function(e,d) {
                        
                                Tooltip
                                .html("<h6>" + d.country +"<br>" +  "</h6>" + "<p> Quantity: " + d.quantity + "<br>" + "Unit: " + d.unit + "</br>" + "Year: " + d.year + "</p>")
                                .style("left", (d3.pointer(e)[0]+70) + "px")
                                .style("top", (d3.pointer(e)[1]) + "px")
                            }
                            var mouseleave = function(e,d) {
                                Tooltip
                                .style("opacity", 0)
                                d3.select(this)
                                .style("stroke", "none")
                                .style("opacity", 0.8)
                            }
                      
                            function ticked() 
                            {
                                var u = d3.select('svg')
                                    .selectAll('circle')
                                    .data(nodes)
                                    .join('circle')
                                    .attr('r', function (d) 
                                    {
                                        return d.radius
                                    })

                                    .attr('cx', function(d) 
                                    {
                                    return d.x
                                    })

                                    .attr('cy', function(d) 
                                    {
                                    return d.y
                                    })

                                    .style("fill", function (d)
                                    {
                                        return mColors(d)
                                    })
                                    
                          
                                    .call(d3.drag() // call specific function when circle is dragged
                                    .on("start", dragstarted)
                                    .on("drag", dragged)
                                    .on("end", dragended))
                                    
                                    .on("mouseover", mouseover)
                                    .on("mousemove", mousemove)
                                    .on("mouseout", mouseleave)
                            
                            } 
        }
    )
}

populateDD();
window.addEventListener("resize", () => {getCSVData(parameter,filter)});





