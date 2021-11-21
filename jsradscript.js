"use strict";
// Author: Thomas Kubler, Maj, USAF
//  Department of Electrical and Computer Engineering, United States Air Force Academy
// JavaScript source code
// To improve this concept, rewrite go from arrays to completely object-oriented so that the routines can be
// simplified and contextual. What does that mean? Every array with its different properties requires its own routine right now.
// Sections are CONFIG DATA, MASKS, TABLE DATA, COMPUTATION functions, INITIALIZATION, 
// beware that the ^ carat symbol is XOR and not an exponential. use Math.pow(base,exp);
//notes, not in order yet:
const b_studentseesgrade = true; //if you want the student to see their grade each time the sim runs, set this to true. This will also
//make the simulation use the Keyed values for ranges as opposed to what the student thinks the ranges are, as well as keyed comm links.
/******************************************** PHYSICAL CONSTANTS ************************************************************************/
const SOL = 300000000; //speed of light will be 3x 10 ^8 m/s, per equation sheet
const FOURPI = 4*Math.PI;
const FOURPICUBE = 4*4*4*Math.PI*Math.PI*Math.PI;
const KMPERMILE = 1.61; //per equation sheet
//all distances are in km, not meters, and line of sight is based upon Distance(miles) = Sqrt(2*height(feet))
/********************************************************************** CONFIG DATA ****************************************************/
//Config data resides here. not configurable: 9x9 grid, 2 harms per pack for the first two packs, 2 packs required to complete mission, N/S directions, 
//and many of the rules including the # of package types or anything that will redimension arrays without extensive re-coding!
const STUDENTSPERGROUP = 1; //number of students per group
//These consts are all UPPERCASE and an A prefix designates an ARRAY
const CYBERCOST = 10000; //dollars, cost of a cyber attack
const FCOMM = 60000000; //Hz, Communications freq in use
const FRADAR = 4500000000; //Hz, Radar freq
const NUMSTRIKES = 3; //not configurable. Following arrays need this # of members, number of strike options to choose from
const ASTRIKENAMES = ["Conventional_Strike", "Mixed_Strike", "Stealth_Strike"]; //text
const TABLENAMES = [
    "Table 1: Radio-Type to Radio-Type Power-Range (km)",
    "Table 2: Site-to-Site Separation(km), LOS(km), & Visibility(YES/NO)",
    "Table 3: Site-to-Site Communication (YES/NO)",
    "Table 4: RADAR to Aircraft to RADAR Power-Range (km)",
    "Table 5: Site to Aircraft LOS Range (km)",
    "Table 6: Site's Detection Range of Aircraft (km)",
    "Table 7: RADAR Burn-Through Power-Range (km)",
    "Table 8: Aircraft RWR Power-Range (km)",
    "Table 9: Flight Plans (Fill out at least 2 columns with numbers 1..9)",
    "Table 10: Orders List (Specify N for None, C for Conventional, M for Mixed, or S for Stealth)",
    "Table 11: HARM Target List (0 for None. 1...5 for a hill ordered shortest to tallest, each target costs 2 points against your grade)"
];
const ACOST = [30000, 35000, 55000]; //cost of each strike type, in dollars
const ARCS = [5.5, 3.5, 0.01]; //RCS of the attacker
const AALT = [2000, 3000, 6000]; //altitude to fly at (all altitudes in this game are MSL-Mean Sea Level), where non-hill regions are zero feet.
//game does not check for unrealistic choices of altitude such as negatives or too high.
const ARWRG = [1, 1.5, 2]; //RWR Gain
const ARWRPR = [0.000000005, 0.000000005, 0.000000005]; //RWR Power Receive (minimum)
const AJAMPT = [10, 8, 5]; //Jammer P_T in Watts
const AJAMGT = [3, 3, 1]; //Jammer Gain
const AHARMQTY = [2, 2, 0]; //Number of HARM missiles that can be expended
const HARMRANGE = 250; //range of a HARM shot, km
const BUDGET = 100000; //dollars
//HARM could also be RWR and LOS limited, so data references table for site to acft (acft to site)
//HARM only uses center of cell to center of cell for distance computation. small disadvantage as sams ability to shoot the acft
// is based upon any part of the cell being within range (9 critical points are checked: 4 corners, 4 midpoints of sides, and the center)
const NUMSAMTYPES = 3; //next set of arrays need this number of members
const ASAMNAMES = ["MPQ-26", "MPQ-30", "MPQ-32"]; //text that is displayed on map as well as in Spreadsheet
const ACOMMG = [2, 9, 16]; //Gain of the communications system of this type
const ACOMMPT = [50, 50, 50]; //P_T in Watts for communications
const ACOMMPR = [0.000000001, 0.000000001, 0.000000001]; //P_R minimum in Watts for communications
const ARADG = [3500, 4000, 4500]; //Gain of Radar system
const ARADPT = [8000, 9000, 10000]; //P_T of Radar system
const ARADPR = [0.000000000000001, 0.000000000000001, 0.000000000000001 ]; //P_R minimum of Radar system
const ARADSNR = [0.0001, 0.0001, 0.0001]; //Minimum SNR of Radar system, where noise is from opposing jammer
//if you order the hills from shortest to highest it makes referencing tables faster
//but the order they show up here is the order they'll show up in every table
// so unique is not required but helpful since there are no names
//position data is 1..9 (0 is used as the unassigned value)
const NUMDUDS = 4; //hills with no SAM site are a "DUD". Next 3 arrays need to have this length
const ADUDX = [6,4,8,2];                //x position in grid, 1..9
const ADUDY = [6,9,1,5];                //y position in grid, 1..9
const ADUDH = [1500, 2300, 2700, 2800]; //height in feet
//if you order the hills from shortest to highest it makes referencing tables faster
//but the order they show up here is the order they'll show up in every table
// so unique is not required but helpful since there are no names
const NUMSITES = 5;  //if you modify this, you'll need to do a lot of redimensioning!
const ASAMX = [1,5,3,7,9]; //x position of sam site-hill combo, 1..9
const ASAMY = [2,7,4,3,9]; //y position ""
const ASAMH = [1800, 2200, 2900, 3100, 3300]; //hill/sam height in feet
const ASAMTYPE = [1,2,0,2,0]; //0..2 in the case of 3 sam types
//world parameters:
const kmpergrid = 60; //km per grid square
const pxpergrid = 60; //how many pixels in the canvas each grid should take up
const xstart = 60; //where the top left of the grid is inside the Canvas
const ystart = 60; //""y
const yend = ystart + 9*pxpergrid; //where grid ends (y) vertically on canvas
let pxhalfgrid = pxpergrid / 2; //offset from edge of grid-square to center
let pxhillradius = pxhalfgrid - 4; //radius for a hill (need not entirely fill a grid)
let letters = ['a','b','c','d','e','f','g','h','i']; //letters along the left side of grid
let numbers = ['1','2','3','4','5','6','7','8','9']; //numbers along the bottom of the grid
//Where to find each table in the XLSX file by row number (always first columns)
const NameRow = 3;
const Table1CommRangeRow = NameRow + STUDENTSPERGROUP + 3;
const Table2VisibilityRow = Table1CommRangeRow + NUMSAMTYPES + 3;
const Table3CommLinkRow = Table2VisibilityRow + 3*(NUMSITES-1) + 3;
const Table4PowerRangeRow = Table3CommLinkRow + NUMSITES-1 + 3;
const Table5RADARLOSRow = Table4PowerRangeRow + NUMSAMTYPES + 3;
const Table6RADARdetRow = Table5RADARLOSRow + NUMSITES + 3;
const Table7BurnRow = Table6RADARdetRow + NUMSITES + 3;
const Table8RWRRow = Table7BurnRow + NUMSAMTYPES + 3;
const Table9FPlanRow = Table8RWRRow + NUMSAMTYPES + 3;
const Table10OrdersRow = Table9FPlanRow + 18 + 1;
const Table10HARMRow = Table10OrdersRow + 7;
/******************************************************************** CONFIG: MASKS, PTS *******************************************/
//Masks determine which values will be provided by the software
//these must be redimensioned if the dimensions of config data change. otherwise, modify 1 to 0 and 0 to 1 to change blanks.
// include a POINTS variable to know how to score the tables as well for grading
// 0 = get from web user (student will compute)
// 1 = compute internally and provide in template file (given to student)
// For lookup tables that are diagonal, they remain rectangular here but will be the upper-right-half when sent to the template
//Table 1 Comm Range Friis Radio to Radio
const M1COMMTYPEPOWERRANGE = [  [0,1,1],
                                [1,0,0],
                                [1,0,1]];
const P1COMMTYPEPOWERRANGE = 2; //for student grading, how many points per entry in this category
// with 4x "0"s in this table, at points of 2 each, there are 8 points for this table
//Table 2 "Visibility" which should be next, R_MAX_LOS of SAM TO SAM
const M2SITESITEVIS = [ [1,1,0,0,0],
                        [1,1,0,1,1],
                        [1,1,1,1,1],
                        [1,1,1,1,1],
                        [1,1,1,1,1]];
const P2SITESITEVIS = 1;
const M2SITESITELOS = [ [1,1,0,0,0],
                        [1,1,0,1,1],
                        [1,1,1,1,1],
                        [1,1,1,1,1],
                        [1,1,1,1,1]];
const P2SITESITELOS = 1;
//table sub-part separation distance: no mask. all of it is given
//Table 3 Comm Links Established? 
const M3COMMLINK = [0,1,0,0,0,1,0,0,0,0]; //5 choose 2 = 10;
//comm link table generated dynamically based upon NUMSITES
const P3COMMLINKS = 1;
//Table 4: Radar Detection Range based upon target and return strength
//Row: Which Radar system type, column: package
const M4RADARTYPEPOWERRANGE  = [[1,0,1],
                                [1,0,1],
                                [0,1,0]];
const P4RADARTYPEPOWERRANGE = 2;
//Table 5: Radar Range based upon LOS (don't care about dud hills
const M5SITEACFTLOS  = [[0,1,1],
                        [1,1,1],
                        [1,0,1],
                        [1,1,0],
                        [1,1,1]];
const P5SITEACFTLOS = 1;
//Table 6: entirely student determined
const M6SITEACFTDETRANGE = [[0,0,1],
                            [0,1,0],
                            [1,0,1],
                            [0,1,0],
                            [1,0,1]];
const P6SITEACFTDETRANGE = 1;
//Table 7: Burn Through. Row is the radar type, column is the package type
const M7RADARTYPEACFTBURN  =  [ [0,1,1],
                                [1,0,1],
                                [1,1,0]];
const P7RADARTYPEACFTBURN  = 1;
//Table 8: RWR Range: Row is the radar type, column is the package type
const M8RADARTYPEACFTRWR = [[1,1,0],
                            [1,0,1],
                            [0,1,1]];
const P8RADARTYPEACFTRWR = 1;
const POINTSSUCCESS = 16;
const POINTSHARM = 2;
/*********************************************************** TABLES FOR COMPUTATIONS AND ANSWER KEYS ***********************************/
var StudentSection;
let A0StudentNames = new Array(STUDENTSPERGROUP);
for(var q = 0; q < STUDENTSPERGROUP; q++){
    A0StudentNames[q] = new Array(2); //last, first
}
//Table 1: Comm Range on Power: 3x3. Row=From, Column=To
//function that computes range
let A1CommTypePowerRange = new Array(NUMSAMTYPES); //the A-prefix are the Arrays that will be student modified.
for(var q = 0; q < NUMSAMTYPES; q++){
    A1CommTypePowerRange[q] = new Array(NUMSAMTYPES);
}
let K1CommTypePowerRange = new Array(NUMSAMTYPES); //the K-prefix arrays are the KEY values to grade against.
for(var q = 0; q < NUMSAMTYPES; q++){
    K1CommTypePowerRange[q] = new Array(NUMSAMTYPES);
}
//Table 2: Visibility, LOS, and Separation: 5x5
let A2SiteSiteVIS = new Array(NUMSITES);
let A2SiteSiteLOS = new Array(NUMSITES);
let A2SiteSiteSEP = new Array(NUMSITES);
for(var q = 0; q < NUMSITES; q++){
    A2SiteSiteVIS[q] = new Array(NUMSITES);
    A2SiteSiteLOS[q] = new Array(NUMSITES);
    A2SiteSiteSEP[q] = new Array(NUMSITES);    
}
let K2SiteSiteVIS = new Array(NUMSITES);
let K2SiteSiteLOS = new Array(NUMSITES);
//let KSiteSiteSEP = new Array(NUMSITES);
for(var q = 0; q < NUMSITES; q++){
    K2SiteSiteVIS[q] = new Array(NUMSITES);
    K2SiteSiteLOS[q] = new Array(NUMSITES);
    //KSiteSiteSEP[q] = new Array(NUMSITES);    
}
//Table 3: Comm Link (yes/no) 10x1 with lookups to form half a 4x5
//Comm-Link Data and helper functions. These depend on configuration data above.
function HowManyCommLinksAreNeeded(big, small){
    //compute a Big-Choose-Small: e.g. 5 choose 2 (or 3) is: (5!/(2!*3!) = 5*4*3*2 / (2 * 3 * 2) = 10;
    var q;
    var result = 1;
    for(q = big; q > 1; q--){
        result = result * q;
    }
    for(q = 2; q <= small; q++){
        result = result / q;
    }
    for(q = 2; q <= big-small; q++){
        result = result / q;
    }
    return result;
}
let numcommlinks = HowManyCommLinksAreNeeded(NUMSITES,2);  //really 5 choose 2.
let A3commlinks = new Array(numcommlinks);    //boolean for whether the link set from the user's input
let K3commlinks = new Array(numcommlinks);    //boolean for whether the link set from the user's input
//Table 4: Maximum Radar Detection Range: Power 3x3
let A4RADARTypePowerRange = new Array(NUMSAMTYPES);
for(var q = 0; q < NUMSAMTYPES; q++){
    A4RADARTypePowerRange[q] = new Array(3); //number of strike types here
}
let K4RADARTypePowerRange = new Array(NUMSAMTYPES);
for(var q = 0; q < NUMSAMTYPES; q++){
    K4RADARTypePowerRange[q] = new Array(3); //number of strike types here
}
//Table 5: Maximum Radar Visibility Range: LOS 5x3
let A5SiteAcftLOS = new Array(NUMSITES);
for(var q = 0; q < NUMSITES; q++){
    A5SiteAcftLOS[q] = new Array(3); //number of strike types here
}
let K5SiteAcftLOS = new Array(NUMSITES);
for(var q = 0; q < NUMSITES; q++){
    K5SiteAcftLOS[q] = new Array(3); //number of strike types here
}
//Table 6 + Helper for Drawing: Actual detection range (no mask). Also declare the jammer look up table here   5x3
let A6SiteAcftDetRange = new Array(NUMSITES);
let ASiteAcftBurnRange = new Array(NUMSITES);
for(var q = 0; q < NUMSITES; q++){
    A6SiteAcftDetRange[q] = new Array(3); //3 = number of package types
    ASiteAcftBurnRange[q] = new Array(3); //grab values by look up.
}
let K6SiteAcftDetRange = new Array(NUMSITES);
let KSiteAcftBurnRange = new Array(NUMSITES);
for(var q = 0; q < NUMSITES; q++){
    K6SiteAcftDetRange[q] = new Array(3); //3 = number of package types
    KSiteAcftBurnRange[q] = new Array(3); //grab values by look up.
}
// Table 7: Burn Through   3x3
let A7RADARTypeAcftBurn = new Array(NUMSAMTYPES);
let K7RADARTypeAcftBurn = new Array(NUMSAMTYPES);
for(var q = 0; q < NUMSAMTYPES; q++){
    A7RADARTypeAcftBurn[q] = new Array(3);
    K7RADARTypeAcftBurn[q] = new Array(3);
}
// Table 8: RWR Ranges   3x3 - RWR is also used for determining HARM maximum range?
let A8RADARTypeAcftRaw = new Array(NUMSAMTYPES);
let K8RADARTypeAcftRaw = new Array(NUMSAMTYPES);
for(var q = 0; q < NUMSAMTYPES; q++){
    A8RADARTypeAcftRaw[q] = new Array(3);
    K8RADARTypeAcftRaw[q] = new Array(3);
}
// Table 9: Flight Plans 3x18
//each package's flightplan is a 1-D array. Every move increments in the Y-dimension by one cell. For a 9x9, there are 18 spots.
//  value of 0 = invalid location, and a valid position is 1...9, which is the X-dimension value.
let A9fplans = new Array(3); //num packages
for(var q = 0; q < 3; q++){
    A9fplans[q] = new Array(18);
}
//Table 10: ACO, ATO, Targeting Data:
let First_Package; //-1, 0, 1, 2. When the value is -1, it is unspecified. 0, 1, or 2 specify which is first
let Second_Package; //-1, 0, 1, 2
let EWJamming; //-1, 0, 1, 2
let CyberAttack; //-1, 0, 1, 2
let CyberInbound; //true for inbound, false for outbound
let HARMTargetList = new Array(NUMSTRIKES); //-1 for no target. 0..4 for targets
let HARMShotSlots = new Array(NUMSTRIKES);
for(var p = 0; p < NUMSTRIKES; p++){
    HARMTargetList[p] = new Array(AHARMQTY[p]);
    HARMShotSlots[p] = new Array(AHARMQTY[p]); //1 for ready, 0 for spent
}
function ReloadHARMs(){
    for(var p = 0; p < NUMSTRIKES; p++){
        for(var h = 0; h < AHARMQTY[p]; h++){
            HARMShotSlots[p][h] = 1;
        }
    }
}
function UpdateSitesAndCommLinksForDisabledSites(){
    //assume program has just changed 1 value of samdisabled[index] to true.
    //this function will then set all commlink that touch any disabled sam, to false.
    //and then as a second routine, go through every sam and count how many active
    //comm links are up. if the number is 0, then that sam is also disabled.
    //but routine doesn't need to update. topologically this doesn't propagate.
    //part 1: clean up comm links
    for(var link = 0; link < numcommlinks; link++){
        var site1 = maplinktosam(link, true);
        var site2 = maplinktosam(link,false);
        if(samdisabled[site1] || samdisabled[site2]){
            commDisabled[link] = true;
        }
    }
    //part 2: clean up sites based on no comm links
    for(var site = 0; site < NUMSITES; site++){
        var activelinkstosite = 0;
        for(var link = 0; link < numcommlinks; link++){
            var site1 = maplinktosam(link, true);
            var site2 = maplinktosam(link,false);
            if(site1 == site || site2 == site){
                if(b_gradermode || b_studentseesgrade){//Keyed
                    if(!commDisabled[link] && K3commlinks[link]){ 
                        activelinkstosite++;
                    }
                }
                else{
                    if(!commDisabled[link] && A3commlinks[link]){
                        activelinkstosite++;
                    }
                }
            }
        }
        if(activelinkstosite < 1){
            samdisabled[site] = true;
        }
    }
}
//Other Helpers:
let ASamVisToHorizon = new Array(NUMSITES); //one-way vis to horizon, helper feature
let AAcftVisToHorizon = new Array(NUMSTRIKES); //one-way vis to horizon, helper feature
//Given a link which sam site is it linking?
//pass a number 0..9 (for 10 links), and a "true/false" where true is the TO site, and false is the FROM site
function maplinktosam(whichlink, boolTo){
    var frompos = 0;
    var topos = 1;
    var prevbase = 1;
    for(var q = 0; q < whichlink; q++){
        topos++;
        if(topos >= NUMSITES){
            topos = prevbase+1;
            prevbase = topos;
            frompos++;
        }
    }
    if(boolTo){
        return topos;
    }
    else{
        return frompos;
    }
}
function gridToPixelx(gridx){    return xstart + gridx*pxpergrid - pxhalfgrid;}
function gridToPixely(gridy){
    //this allows for smoothly exiting at the edge of the board. positions 1..9 are on the board, and 0 and 10 are the edges.
    //when going back down the board, positions are 10..0 again. (so be at position 10 twice)
    var result = ystart + (10-gridy)*pxpergrid - pxhalfgrid;
    var fy = gridy;
    if(fy == 0){
        result = ystart + 9*pxpergrid;
    }
    if(fy == 10){
        result = ystart;
    }
    return result;
}
function gridToKm(gridx){        return gridx*pxpergrid;}
//MORE COMPUTE FUNCTIONS ARE IN THE INSTRUCTOR.JS
function ComputeCost(){
    var cost = 0;
    if(First_Package >= 0 && First_Package < NUMSTRIKES){
        cost += ACOST[First_Package];
    }
    if(Second_Package >= 0 && Second_Package < NUMSTRIKES){
        cost += ACOST[Second_Package];
    }
    if((CyberAttack == First_Package || CyberAttack == Second_Package) && CyberAttack > -1){
        cost += CYBERCOST;
    }
    return cost;
}
/**************************************************** SIM VARIABLES ************************************************/
let teststep = 0; //counter for display on screen. counts up forever with every frame
var b_loaded;
var v_interval;
const n_timeinterval = 40;  //milliseconds
let n_simstep;              //reset to 0 at start of sim
let n_simpartial;           //reset to 0 at start of sim
let n_simpartialstep; //step size out of 1. set to 1 or greater for no partial steps
let b_crossover;
let b_simulating;
let b_showresults; //keep up the airplane and final step until interaction starts
let b_cyberactive; //just gray out all the rings and sites while active
let b_jamactive; //grays out the blue rings when this is active
let b_success;
let b_gradermode = false;
//var myAirplane;
let samdisabled = new Array(NUMSITES); //resets at beginning of each simulation
let commDisabled = new Array(numcommlinks); //when "true" a comm link is temporarily masked due to sam destruction
//the Step arrays tell the game how to step through the game by telling it:
const StepToX = [0,0,1,2,3,4,5,6,7,8,8,9,9,10,11,12,13,14,15,16,17,17]; //given a step-value, returns the index that will in turn provide the X coord
const StepToY = [0,1,2,3,4,5,6,7,8,9,10,10,9,8,7,6,5,4,3,2,1,0]; //given a step-value, returns the index that will in turn provide the Y coord
const StepToT =           [0,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,0]; //only "T" Test for "hits" from sams at values of 1. 0 are free-positions
const StepMaskCheckNext = [0,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,0,0]; //whether the next move has to be checked
const StepToM = [0,1,2,3,4,5,6,7,8,9,0,0,8,7,6,5,4,3,2,1,0,0]; //gives the mirror'd value of position to check for overlap
//uphill and downhill
var FirstSouthbound = 11; //at step = 11 and later, draw the airplane southbound
var myActiveWaypointGridy; 
var myActiveWaypointIndex;
var myActiveWaypointInPlay;
var myActiveProgress; //the percentage of progress towards that waypoint
var myNextWaypointIndex;
var myNextWaypointGridy;
var ExitMessage;
//User Interface variables
let whichPackage;
let vis_LOS;
let vis_Dist;
let vis_Radar;
let vis_Jam;
let vis_Links;
let vis_fplan;
var combinednames;
var totalcost;
var displaytargetlist;
//******************************************************************* INITIALIZATION FUNCTION ****************************************** */
//Browsers may fail to load the instructor.js file. Troubleshoot using "async" or "defer"
//LoadINstructorMOde is copied from:
//https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file
//https://www.html5rocks.com/en/tutorials/speed/script-loading/
//function ToggleInstructor(){
//    var x = document.getElementById("instr-btn");
//    var y = document.getElementById("instr"); //visible or hidden
//    if(instructor_mode == false){
//        instructor_mode = true;
//        y.style.visibility = "visible";
//        x.textContent = "Refresh page to undo (F5)";
//    }
//    //prevent toggling out of instructor and tell user to use F5
//    InitGame();
//}

var fileInput = document.getElementById("fileselector");

function InitGame() {
    fileInput.addEventListener("click", function() {
        fileInput.value = null;
    });
    original_sheet_html = document.getElementById('data-table').outerHTML;
    //if(instructor_mode == true && instructor_loaded == false){
    //        console.log("loading instr script");
    //        loadInstructorMode("instructorjsrad.js", ContinueLoading);
    //}
    //else{
        ContinueLoading();
    //}
}
//function loadInstructorMode(url, callback){
//    var head = document.head;
//    var script = document.createElement('script');
//    script.type = 'text/javascript';
//    script.src = url;
//    script.onreadystatechange = callback;
//    script.onload = callback;
//    head.appendChild(script);
//}
var ContinueLoading = function () {
    console.log("loading game");
    //if(instructor_mode == true){
    //    instructor_loaded = true; //instructor.js is loaded, so set to true to prevent further loading
    //}
    //else{
    //   var y = document.getElementById("instr"); //visible or hidden
    //    y.style.visibility = "hidden";
    //}
    //in student mode, clear all the computation tables to zero. All values will come from the student's file.
    //in instructor mode, compute all values and place into both the A and K arrays (displayed and keys), then when
    //inspecting a student's file, only masked values will be placed into the simulation so that a student cannot
    //erroneously modify other ungraded parameters of the simulation.
    //name vector:
    combinednames = "";
    for(var stu = 0; stu < STUDENTSPERGROUP; stu++){
        A0StudentNames[stu][0] = "Last"+(stu+1).toString();
        A0StudentNames[stu][1] = "First"+(stu+1).toString();
        combinednames += A0StudentNames[stu][0];
        if(stu < STUDENTSPERGROUP-1)
            combinednames += ", ";
    }
    //if(instructor_mode == true){ //then compute all A and K arrays in tables 1..8
        //Table 3 - Linear
        for(var i = 0; i < numcommlinks; i++){
            A3commlinks[i] = ComputeCommLink(i);
            K3commlinks[i] = ComputeCommLink(i);
        }
        //Table 1, 4, 7, 8 (NUMSAMTYPES, then by ..) 
        for(var samtype = 0; samtype < NUMSAMTYPES; samtype++){
            //Table 1, by NUMSAMTYPES [3x3]
            for(var typey = 0; typey < NUMSAMTYPES; typey++){
                K1CommTypePowerRange[samtype][typey] = ComputeCommTypePowerRange(samtype,typey);
                A1CommTypePowerRange[samtype][typey] = ComputeCommTypePowerRange(samtype,typey);
            }
            //Table 4, 7, 8 by NUMPACKAGETYPES [3x3]
            for(var p = 0; p < NUMSTRIKES; p++){
                //Table 4
                K4RADARTypePowerRange[samtype][p] = ComputeRADARTypePowerRange(samtype,p);
                A4RADARTypePowerRange[samtype][p] = ComputeRADARTypePowerRange(samtype,p);
                //Table 7
                K7RADARTypeAcftBurn[samtype][p] = ComputeRADARTypeStrikeBurn(samtype, p);
                A7RADARTypeAcftBurn[samtype][p] = ComputeRADARTypeStrikeBurn(samtype, p);
                //Table 8
                K8RADARTypeAcftRaw[samtype][p] = ComputeRADARTypeStrikeRWR(samtype, p);
                A8RADARTypeAcftRaw[samtype][p] = ComputeRADARTypeStrikeRWR(samtype, p);
            }
        }
        //Table 2, 5, 6 (by NUMSITES)
        for(var site = 0; site < NUMSITES; site++){
            //then by NUMSITES (Table 2) [5x5]
            for(var sitey = 0; sitey < NUMSITES; sitey++){
                A2SiteSiteSEP[site][sitey] = ComputeSiteSeparation(site,sitey);
                //KSiteSiteSEP[site][sitey] = ComputeSiteSeparation(site,sitey);
                A2SiteSiteLOS[site][sitey] = ComputeSiteMaxLOS(site,sitey);
                K2SiteSiteLOS[site][sitey] = ComputeSiteMaxLOS(site,sitey);
                if(ComputeSiteMaxLOS(site,sitey) > ComputeSiteSeparation(site,sitey)){
                    A2SiteSiteVIS[site][sitey] = true;
                    K2SiteSiteVIS[site][sitey] = true;
                }
                else{
                    A2SiteSiteVIS[site][sitey] = false;
                    K2SiteSiteVIS[site][sitey] = false;
                }       
            }
            //Then by Packages (Tables 5, 6) [5x3]
            for(var p = 0; p < NUMSTRIKES; p++){
                K5SiteAcftLOS[site][p] = ComputeSiteStrikeLOS(site,p);
                A5SiteAcftLOS[site][p] = ComputeSiteStrikeLOS(site,p);
                K6SiteAcftDetRange[site][p] = ComputeSiteStrikeDetRange(site,p);
                A6SiteAcftDetRange[site][p] = ComputeSiteStrikeDetRange(site,p);
                //the helper arrays mean not needing to do table look-ups during drawing or testing collisions
                ASiteAcftBurnRange[site][p] = A7RADARTypeAcftBurn[ASAMTYPE[site]][p];
                KSiteAcftBurnRange[site][p] = K7RADARTypeAcftBurn[ASAMTYPE[site]][p];
            }
        }
    //}
    //Table 9: Flight Plan [linear]
    for(var p = 0; p < 3; p++){
        for(var w = 0; w < 18; w++){
            A9fplans[p][w] = 0;
        }
    }
    //initialize the helpers:
    for(var site = 0; site < NUMSITES; site++){
        ASamVisToHorizon[site] = KMPERMILE*Math.sqrt(2*ASAMH[site]);
    }
    for(var acft = 0; acft < NUMSTRIKES; acft++){
        AAcftVisToHorizon[acft] = KMPERMILE*Math.sqrt(2*AALT[acft]);
    }
    //initialize variables for airplane icon, comm links grid, comm links on, and then do a draw
    //myAirplane = new Image(30,30);
    //myAirplane.src = "airplane.gif";
    //sim status
    b_zipping = false;
    b_loaded = false; //set to true after a successful file load
    b_simulating = false;
    b_jamactive = false;
    b_crossover = false;
    b_cyberactive = false;
    b_showresults = false;
    b_success = false;
    b_gradermode = false;
    n_simpartialstep = 0.1; //10 framers per step
    //User Interface variables
    vis_LOS = false;
    vis_Dist = false;
    vis_Radar = false;
    vis_Jam = false;
    vis_Links = false;
    vis_fplan = false;
    First_Package = -1;
    Second_Package = -1;
    EWJamming = -1;
    CyberAttack = -1;
    CyberInbound = true;
    //Table 10: ACO, ATO, Targeting Data:
    for(var p = 0; p < NUMSTRIKES; p++){
        for(var h = 0; h < AHARMQTY[p]; h++){
            HARMTargetList[p][h] = -1;
        }
    }  
    totalcost = ComputeCost();
    whichPackage = 0;
    ExitMessage = " ";
    //do a redraw
    UpdateCanvas();
    DrawLegend();
}
//End InitGame()
//******************************************************************* DRAWING ****************************************** */
function DrawDistWithBackground(midx, midy,distinkm, ctx, color){
    ctx.fillStyle = "white";
    ctx.font = "12px Tahoma heavy";
    ctx.fillRect(midx-22,midy-5,65,10);
    ctx.fillStyle = color;
    ctx.fillText(distinkm.toFixed(2)+"km",midx-20,midy+5);
}
function LegendObject(midx, midy, ctx, color, remembercolor,which){
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    switch(which){
        case "line": ctx.fillRect(midx-10,midy-1,20,3); break;
        case "circle":
            ctx.beginPath();
            ctx.arc(midx,midy,8,0,2*Math.PI);
            ctx.fill();
            ctx.closePath(); break;
        case "circumference":
            ctx.beginPath();
            ctx.arc(midx,midy,8,0,2*Math.PI);
            ctx.stroke();
            ctx.closePath(); break;
        default: break;

    }
    ctx.fillStyle = remembercolor;
}
function DrawLegend(){
    var thiscanvas = document.getElementById("legendcanvas");
    var ctx = thiscanvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.font = "12px Tahoma heavy";
    var y = 0;
    ctx.fillText("User-Entered:",10,y+=20);
    LegendObject(25,y-5+20,ctx,"#D55","black","line");
    ctx.fillText("Comm Links (Table 3)",50,y+=20);
    LegendObject(25,y-5+20,ctx,"blue","black","circumference");
    ctx.fillText("Detection Radius (Table 6)",50,y+=20);
    LegendObject(25,y-5+20,ctx,"red","black","circumference");
    ctx.fillText("Burn-Through Radius (Table 7)",50,y+=20);
    LegendObject(25,y-5+20,ctx,"#F5F","black","line");
    ctx.fillText("Flight Plan (Table 9)",50,y+=20);
    ctx.fillText("Simulation-Driven:",10,y+=20);
    LegendObject(25,y-5+20,ctx,"green","black","circle");
    ctx.fillText("Active SAM Site",50,y+=20);
    LegendObject(25,y-5+20,ctx,"#555","black","circle");
    ctx.fillText("Inactive SAM Site",50,y+=20);
    LegendObject(25,y-5+20,ctx,"gray","black","circle");
    ctx.fillText("Hilltop",50,y+=20);
    LegendObject(25,y-5+20,ctx,"orange","black","line");
    ctx.fillText("Jammer or Cyber-Attack",50,y+=20);
    LegendObject(25,y-5+20,ctx,"#777","black","line");
    ctx.fillText("Disabled Link",50,y+=20);
    LegendObject(25,y-5+20,ctx,"gray","black","circumference");
    ctx.fillText("Disabled Det or Burn Radius",50,y+=20);
    LegendObject(25,y-5+20,ctx,"blue","black","line");
    ctx.fillText("Entered Detection without Jamming",50,y+=20);
    LegendObject(25,y-5+20,ctx,"red","black","line");
    ctx.fillText("Encountered Burn-Through",50,y+=20);
}
function UpdateCanvas(){
    var i;
    teststep++;
    //depending on which package is being viewed, the rings, flightplans, and airplane
    //and finally a status message on the right side
    var thecanvas = document.getElementById("TheCanvas");
    var ctx = thecanvas.getContext("2d");
    //clears the canvas
    ctx.clearRect(0,0,thecanvas.width,thecanvas.height);
    //draw the grid
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    for(i=0; i < 10 ;i++){
        ctx.beginPath();
        ctx.moveTo(xstart + i*pxpergrid, ystart);
        ctx.lineTo(xstart + i*pxpergrid, ystart + 9*pxpergrid);
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.moveTo(xstart, ystart + i*pxpergrid);
        ctx.lineTo(xstart + 9*pxpergrid, ystart + i*pxpergrid);
        ctx.stroke();
        ctx.closePath();
    }
    //draw the hills as filled in gray circles & add text for heights
    for(i = 0; i < NUMDUDS; i++){
        var xcenter = gridToPixelx(ADUDX[i]);
        var ycenter = gridToPixely(ADUDY[i]);
        ctx.beginPath();
        ctx.fillStyle = "gray";
        ctx.arc(xcenter, ycenter, pxhillradius, 0, 2* Math.PI);
        ctx.fill();
        ctx.closePath();
        ctx.fillStyle = "black";
        ctx.font = "14px Tahoma Heavy";
        var height = ADUDH[i];
        ctx.fillText(height.toString(),xcenter-17,ycenter+5);
    }
    //draw the links between the hills (active only)
    if(vis_Links){
        ctx.lineWidth = 4;
        for(i = 0; i < numcommlinks; i++){
            if(A3commlinks[i] > 0){
                var color = "#D55"; //404 for purple
                if(b_cyberactive || commDisabled[i]){ //if cyber is active or if the link is down
                    color = "#777";
                }
                ctx.strokeStyle = color;
                var samfrom = maplinktosam(i,false);
                var samto   = maplinktosam(i, true);
                var xfrom = gridToPixelx(ASAMX[samfrom]);
                var yfrom = gridToPixely(ASAMY[samfrom]);
                var xto = gridToPixelx(ASAMX[samto]);
                var yto = gridToPixely(ASAMY[samto]);
                ctx.beginPath();
                ctx.moveTo(xfrom, yfrom);
                ctx.lineTo(xto,yto);
                ctx.stroke();
                ctx.closePath();
                if(vis_Dist){
                    var midx = (xfrom + xto) / 2.0;
                    var midy = (yfrom + yto) / 2.0;
                    var xdist = ASAMX[samfrom] - ASAMX[samto];
                    var ydist = ASAMY[samfrom] - ASAMY[samto];
                    var squared = xdist*xdist + ydist*ydist;
                    var distinkm = Math.sqrt(squared)*kmpergrid;
                    DrawDistWithBackground(midx, midy, distinkm, ctx, color);
                }
                if(b_simulating && b_cyberactive && b_crossover){
                    ctx.strokeStyle = "orange";
                    ctx.lineWidth = 7;
                    ctx.beginPath();
                    ctx.moveTo(xfrom, yfrom);
                    ctx.lineTo(xto,yto);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
    }
    //draw the sam sites as filled in green circles
    //draw the range rings for each site. If cyber or jamming, go gray
    ctx.lineWidth = 2;
    for(i = 0; i < NUMSITES; i++){
        var xcenter = gridToPixelx(ASAMX[i]);
        var ycenter = gridToPixely(ASAMY[i]);
        ctx.fillStyle = "green";
        if(samdisabled[i]){
            ctx.fillStyle = "#555";
        }
        ctx.beginPath();
        ctx.arc(xcenter, ycenter, pxhillradius, 0, 2* Math.PI);
        ctx.fill();
        ctx.closePath();
        if(vis_LOS == true){
            var radius = ASamVisToHorizon[i];
            var drawradius = radius * pxpergrid / kmpergrid;
            var color = "gray";
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(xcenter, ycenter, radius, 0, 2* Math.PI);
            ctx.stroke();
            ctx.closePath();
            if(vis_Dist){
                DrawDistWithBackground(xcenter + drawradius, ycenter, drawradius, ctx, color);
            }
        }
        if(vis_Radar){
            var radius = A6SiteAcftDetRange[i][whichPackage]; //not Keyed. display student's input
            var drawradius = radius*pxpergrid/kmpergrid;
            var color = "blue";
            if(samdisabled[i] || b_cyberactive){// || b_jamactive){
                color = "#777";
            }
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(xcenter, ycenter, drawradius, 0, 2* Math.PI);
            ctx.stroke();
            ctx.closePath();
            if(vis_Dist){
                DrawDistWithBackground(xcenter + drawradius, ycenter-20, drawradius, ctx, color);
            }
        }
        if(vis_Jam){
            var radius = ASiteAcftBurnRange[i][whichPackage];
            var drawradius = radius*pxpergrid/kmpergrid;
            var color = "red";
            if(samdisabled[i] || b_cyberactive){
                color = "black";
            }
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(xcenter, ycenter, drawradius, 0, 2* Math.PI);
            ctx.stroke();
            ctx.closePath();
            if(vis_Dist){
                DrawDistWithBackground(xcenter + drawradius, ycenter, drawradius, ctx, color);
            }
        }
        ctx.fillStyle = "black";
        ctx.font = "14px Tahoma Heavy";
        ctx.fillText(ASAMH[i].toString(),xcenter-17,ycenter-4);
        ctx.fillText(ASAMNAMES[ASAMTYPE[i]],xcenter-27,ycenter+12);
    }
    //draw a mask to get rid of ring's overflow, but only top and bottom and left side so that right side radii show up
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,thecanvas.width,ystart-1);
    ctx.fillRect(0,ystart+9*pxpergrid+1,thecanvas.width,thecanvas.height-ystart+9*pxpergrid+1);
    ctx.fillRect(0,ystart,xstart,thecanvas.height-ystart);
    //draw letters and numbers on the side of the grid
    ctx.fillStyle = "black";
    ctx.font = "20px Tahoma";
    for(i=0;i < 9; i++){
        ctx.fillText(letters[i], xstart - pxhalfgrid-5, ystart + (9-i)*pxpergrid - pxhalfgrid + 10);
        ctx.fillText(numbers[i], xstart + pxhalfgrid + i*pxpergrid - 6, ystart + 9*pxpergrid + pxhalfgrid);
    }
    //draw the flight plan 0..17 indexed
    if(vis_fplan){
        for(i = 0; i < 18; i++){
            var gridx, gridy, prevx, prevy;
            gridx = A9fplans[whichPackage][i];
            if(gridx < 1 || gridx > 9){
                break; //only the for-loop, done drawing
            }
            //cases for the y-value
            if(i < 9){
                gridy = i+1;
                prevy = gridy -1;
            }
            else{
                gridy = 18 - i;
                prevy = gridy + 1;
            }

            //special cases to set the x-value
            if(i == 0 || i == 9){
                prevx = gridx;
            }
            else{
                prevx = A9fplans[whichPackage][i-1];
            }
            ctx.beginPath();
            ctx.strokeStyle = "#F5F";
            ctx.lineWidth = 3;
            ctx.moveTo(gridToPixelx(prevx),gridToPixely(prevy));
            ctx.lineTo(gridToPixelx(gridx),gridToPixely(gridy));
            ctx.stroke();
            ctx.closePath();
            if(i == 8 || i == 17){
                //then also draw a line up to the top or bottom
                prevx = gridx;
                prevy = gridy;
                if(i == 8){
                    gridy = 10;
                }
                else{
                    gridy = 0;
                }
                ctx.beginPath();
                ctx.strokeStyle = "#F5F";
                ctx.lineWidth = 3;
                ctx.moveTo(gridToPixelx(prevx),gridToPixely(prevy));
                ctx.lineTo(gridToPixelx(gridx),gridToPixely(gridy));
                ctx.stroke();
                ctx.closePath();
            }
        }
    }
    ctx.font = "12px Tahoma";
    ctx.fillStyle = "black";
    ctx.fillText(combinednames,250,20); //just a progress counter
    //draw the jamming routine? add a status message
    ctx.font = "20px Tahoma";
    ctx.fillStyle = "black";
    if(b_jamactive && (b_simulating || b_showresults)){
        ctx.fillText("Jammer On",xstart,yend+60);
    }
    if(b_cyberactive  && (b_simulating || b_showresults)){
        ctx.fillText("Cyber Attack Active",xstart+120,yend+60);
    }
    //draw the HARM routine? -I hate the HARM Interface but fine
    //draw the airplane, and also validate whether the flight plan is legal
    if(b_simulating || b_showresults){
        var img;
        var bsouthbound = false;
        if(n_simstep >= FirstSouthbound){
            img = document.getElementById("myiconS");
            bsouthbound = true;
        }
        else{
            img = document.getElementById("myiconN");
        }
        var gridx = A9fplans[whichPackage][myActiveWaypointIndex];
        var gridy = myActiveWaypointGridy;
        var posx  = gridToPixelx(gridx);
        var posy  = gridToPixely(gridy);
        var ngridx = A9fplans[whichPackage][myNextWaypointIndex];
        var ngridy = myNextWaypointGridy;
        var nposx = gridToPixelx(ngridx);
        var nposy = gridToPixely(ngridy);
        var interpolatex = posx + n_simpartial*(nposx - posx);
        var interpolatey = posy + n_simpartial*(nposy - posy);
        if(gridx >= 1 && gridx <= 9){
            ctx.drawImage(img,interpolatex-15,interpolatey-15);
            if(Number.isNaN(ngridx))
                ctx.drawImage(img,posx-15,posy-15);
        }
        if(vis_LOS == true){
            var radius = AAcftVisToHorizon[whichPackage];
            var drawradius = radius * pxpergrid / kmpergrid;
            var color = "gray";
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(interpolatex, interpolatey, radius, 0, 2* Math.PI);
            ctx.stroke();
            ctx.closePath();
            if(vis_Dist){
                DrawDistWithBackground(xcenter + drawradius, ycenter, drawradius, ctx, color);
            }
        }
        if(myActiveWaypointInPlay > 0 && b_crossover){
            //is airplane on a valid leg of a fplan?
            if(StepMaskCheckNext[n_simstep]){
                //is next move still within 1 cell?
                var griddiff = gridx - ngridx;
                if (griddiff < 0) griddiff = -griddiff;
                if(Number.isNaN(gridx)){
                    ExitMessage = "Waypoint is not a number.";
                    HaltSimulation();
                }
                if (gridx < 1 || gridx > 9){
                    ExitMessage = "Waypoint not in range of 1..9.";
                    HaltSimulation();
                }
                if (griddiff > 1 || ngridx < 1 || ngridx > 9 || Number.isNaN(ngridx)){
                    ExitMessage = "Cannot perform next move. Must be 45-diagonal or straight ahead.";
                    if(Number.isNaN(ngridx)){
                        ExitMessage = "Oops, end of flight plan.";
                    }
                    HaltSimulation();
                }
                //is next move going to repeat a cell from the ingress?
                if(bsouthbound){
                    var mirrorindex = StepToM[n_simstep];
                    var mirrorx = A9fplans[whichPackage][mirrorindex];
                    if(mirrorx == gridx){
                        ExitMessage = "A Strike Package cannot fly to the same point twice.";
                        HaltSimulation();
                    }
                }
            }
            //did airplane hit dud dirt?
            for(var h = 0; h < NUMDUDS; h++){
                if(ADUDX[h] == gridx && ADUDY[h] == gridy && ADUDH[h] >= AALT[whichPackage]){
                    ExitMessage = "Terrain Blocking Flighpath.";
                    HaltSimulation();
                }
            }
            //did airplane hit sam dirt?
            for(var h = 0; h < NUMSITES; h++){
                if(ASAMX[h] == gridx && ASAMY[h] == gridy && ASAMH[h] >= AALT[whichPackage]){
                    ExitMessage = "Terrain Blocking Flighpath.";
                    HaltSimulation();
                }
            }
            //is airplane ordered to destory a SAM that is close enough?
            //and/or did airplane penetrate a WEZ?
            var b_ok = true;
            if(!b_cyberactive){
                for(var h = 0; h < NUMSITES; h++){
                    if(!samdisabled[h]){
                        var detrad = A6SiteAcftDetRange[h][whichPackage];
                        if(b_gradermode || b_studentseesgrade) detrad = K6SiteAcftDetRange[h][whichPackage]; //Keyed
                        var jamrad = ASiteAcftBurnRange[h][whichPackage];
                        if(b_gradermode || b_studentseesgrade) jamrad = KSiteAcftBurnRange[h][whichPackage]; //Keyed
                        var rawrad = A8RADARTypeAcftRaw[ASAMTYPE[h]][whichPackage];
                        if(b_gradermode || b_studentseesgrade) rawrad = K8RADARTypeAcftRaw[ASAMTYPE[h]][whichPackage]; //Keyed
                        var radx = gridToKm(ASAMX[h]);
                        var rady = gridToKm(ASAMY[h]);
                        var jetx = gridToKm(gridx);
                        var jety = gridToKm(gridy);
                        var deltax, deltay, checkx, checky;
                        var distance;
                        var stillontargetlist = false;
                        for(var t = 0; t < AHARMQTY[whichPackage]; t++){
                            if(HARMTargetList[whichPackage][t] == h && HARMShotSlots[whichPackage][t] > 0){
                                stillontargetlist = true;
                            }
                        }
                        for(var cx = 0; cx < 3; cx++){
                            checkx = jetx + (cx - 1)*pxpergrid/2;
                            deltax = radx - checkx;
                            for(var cy = 0; cy < 3; cy++){
                                checky = jety + (cy - 1)*pxpergrid/2;
                                deltay = rady - checky;
                                distance = Math.sqrt(deltax*deltax + deltay*deltay);
                                //can airplane jam this site?
                                var lineofsight = A5SiteAcftLOS[h][whichPackage];
                                if(b_gradermode || b_studentseesgrade) lineofsight = K5SiteAcftLOS[h][whichPackage];
                                if(b_jamactive && !samdisabled[h] && distance < rawrad && distance <= lineofsight){
                                    ctx.strokeStyle = "orange";
                                    ctx.lineWidth = 7;
                                    ctx.beginPath();
                                    ctx.moveTo(gridToPixelx(ASAMX[h]),gridToPixely(ASAMY[h]));
                                    ctx.lineTo(gridToPixelx(gridx),gridToPixely(gridy));
                                    ctx.stroke();
                                    ctx.closePath();
                                }
                                //can airplane hit site with harm on target list?
                                if(!samdisabled[h] && stillontargetlist && distance <= rawrad && distance <= lineofsight){
                                    samdisabled[h] = true;
                                    console.log("Harm fired.", h);
                                    UpdateSitesAndCommLinksForDisabledSites();
                                    ctx.strokeStyle = "red";
                                    ctx.lineWidth = 3;
                                    ctx.beginPath();
                                    ctx.moveTo(gridToPixelx(ASAMX[h]),gridToPixely(ASAMY[h]));
                                    ctx.lineTo(gridToPixelx(gridx),gridToPixely(gridy));
                                    ctx.stroke();
                                    ctx.closePath();
                                }
                                //can site hit airplane in non-jamming scenario
                                if(!samdisabled[h] && distance <= detrad && !b_jamactive && b_ok == true){
                                    b_ok = false;
                                    ExitMessage = "Aircraft entered WEZ without ECM.";
                                    ctx.beginPath();
                                    ctx.strokeStyle = "blue";
                                    ctx.lineWidth = 3;
                                    ctx.moveTo(gridToPixelx(ASAMX[h]),gridToPixely(ASAMY[h]));
                                    ctx.lineTo(gridToPixelx(gridx),gridToPixely(gridy));
                                    ctx.stroke();
                                    ctx.closePath();
                                    HaltSimulation();
                                }
                                //can site hit airplane in jamming scenario
                                if(!samdisabled[h] && distance <= jamrad && b_jamactive && b_ok == true){
                                    b_ok = false;
                                    ExitMessage = "Jamming inneffective.";
                                    ctx.beginPath();
                                    ctx.strokeStyle = "red";
                                    ctx.lineWidth = 3;
                                    ctx.moveTo(gridToPixelx(ASAMX[h]),gridToPixely(ASAMY[h]));
                                    ctx.lineTo(gridToPixelx(gridx),gridToPixely(gridy));
                                    ctx.stroke();
                                    ctx.closePath();
                                    HaltSimulation();
                                }
                            }
                        }
                        
                    }
                }
            }
        }
    }
    //status message only for "show results"
    if(b_showresults){
        ctx.font = "16px Tahoma";
        ctx.fillStyle = "black";
        ctx.fillText(ExitMessage,xstart,40);
    }
    if((b_gradermode == true || b_studentseesgrade) && b_showresults == true){
        ScoreCurrentFile();
        return; //remember: no code after this in this routine due to async behavior of ScoreCurrentFile. Stack will have race condition.
    }
}
//************************************ (1) FILE LOADING, RELOADING **********************************
//Called when user loads a single file from the Loading section, accepts only *.xlsx. When attempting to load multiple files, only the first is loaded
var filestograde;
var isthereafiletograde = false;
var whichfiletograde = 0;
var howmanyfilesarethere;
var tableup = false;
var studentsfile;

function LoadXLSXFile(){
    if(b_simulating){
        HaltSimulation(); //just in case you try to load a file while another is running
    }
    b_showresults = false; //clear any potential results and the halt also forces this true
    var reader = new FileReader();
    var name, file;
    if(isthereafiletograde){
        file = filestograde[whichfiletograde];
    }
    else{
        file = event.target.files[0];
    }
    studentsfile = file;
    name = file.name;
    reader.onload = function(event){
        var data = event.target.result;
        var workbook = XLSX.read(data, {type: 'binary'});
        //begin reading the file elements into local data
        ParseXLSXFile(workbook);
        TurnDist(true);
        TurnLOS(false);
        TurnLinks(true);
        TurnRadar(true);
        TurnJam(true);
        TurnFPlan(true);
        //enable the simulation buttons
        document.getElementById("start-btn").disabled = false;
        document.getElementById("halt-btn").disabled = false;
        document.getElementById("start-fast-btn").disabled = false;
        document.getElementById("show-data-btn").disabled = false;
        UpdateCanvas(); //call this BEFORE starting the sim, to avoid asynch problems
        if(b_gradermode == true){
            StartSimulation(0.1); //yeppers! //0.1 for low speed
        }
    };
    reader.readAsBinaryString(file);
}
function DecodeStringToPackage(somestring){
    if(typeof somestring === 'string' && somestring.length > 0){
        var tchar = somestring.charAt(0);
        if(tchar == 'C' || tchar == 'c'){
            return 0;
        }
        else if(tchar == 'M' || tchar == 'm'){
            return 1;
        }
        else if(tchar == 'S' || tchar == 's'){
            return 2;
        }
    }
    return -1;
}
function GrabJSONCell(Object, row, col){
    switch(col){
        case 0:
        return Object[row].Col0; break;
        case 1:
        return Object[row].Col1; break;
        case 2:
        return Object[row].Col2; break;
        case 3:
        return Object[row].Col3; break;
        case 4:
        return Object[row].Col4; break;
        case 5:
        return Object[row].Col5; break;
        case 6:
        return Object[row].Col6; break;
        case 7:
        return Object[row].Col7; break;
        case 8:
        return Object[row].Col8; break;
        case 9:
        return Object[row].Col9; break;
    }
    return "invalid";
}

var current_sheet_html;
var original_sheet_html;
current_sheet_html = original_sheet_html;

function ShowData(){

    if(document.getElementById('data-table').style.display == "none"){
        document.getElementById('data-table').style.display = "block";
        document.getElementById('show-data-btn').textContent = "Hide Table";
    }
    else{
        document.getElementById('data-table').style.display = "none";
        document.getElementById('show-data-btn').textContent = "Show Table";
    }
}

var FirstJSON;


function SetBGColor(row, col, color){
    var table = document.getElementById('data-table');
    var row = table.rows[row+1];
    var cell = row.cells[col];
    cell.style.backgroundColor = color;
}

function ParseXLSXFile(workbook){
    //TODO in instructor mode, in order to grade, this will have to reject unmasked values
    //instructormode
    var f;
    var firstsheetname = workbook.SheetNames[0];
    var firstworksheet = workbook.Sheets[firstsheetname];
    //using example from https://sheetjs.com/demos/modify.html
    current_sheet_html = XLSX.utils.sheet_to_html(firstworksheet).replace("<table", '<table id="data-table" border="1"');
    
    document.getElementById('data-table').outerHTML = current_sheet_html;
    document.getElementById('data-table').style.display = "none";

    FirstJSON = XLSX.utils.sheet_to_json(firstworksheet, {defval:"0"});
    var i, r, c, str;
    //when reading json, the first row of headers doesn't count as a json element,
    //so the first, zero, element is on Excel row 2, and has index 0. Decrement all
    //json indexes by 1 to match how they were created
    combinednames = "";
    for(i = 0; i < STUDENTSPERGROUP; i++){
        A0StudentNames[i][0] = FirstJSON[NameRow+i-1].Col1.toString();
        A0StudentNames[i][1] = FirstJSON[NameRow+i-1].Col2.toString();
        combinednames += A0StudentNames[i][0];
        if(i < STUDENTSPERGROUP-1)
            combinednames += ", ";
        
    }
    StudentSection = FirstJSON[1].Col5.toString();
    console.log(StudentSection, combinednames,"opening file...");
    //Table 1 reading (remember to json index by 1)
    for(r = 0; r < NUMSAMTYPES; r++){
        for(c = 0; c < NUMSAMTYPES; c++){
            //Only write where mask is value zero, such that student is supposed to provide the number.
            if(M1COMMTYPEPOWERRANGE[r][c]==0){
                f = parseFloat(GrabJSONCell(FirstJSON,Table1CommRangeRow-1+r,c+1));
                if(isNaN(f) || f < 0) f=0;
                A1CommTypePowerRange[r][c]=f;
                SetBGColor(Table1CommRangeRow-1+r,c+1, "yellow");
                if(b_zipping){
                    if(CloseEnough(K1CommTypePowerRange[r][c],f))
                        SetBGColor(Table1CommRangeRow-1+r,c+1, "green");
                    else
                        SetBGColor(Table1CommRangeRow-1+r,c+1, "red");
                }
            }
            else{
                SetBGColor(Table1CommRangeRow-1+r,c+1, "lightgray");
            }
        }
    }
    //Table 2
    for(r = 0; r < NUMSITES-1; r++){
        for(c = 0; c < NUMSITES; c++){
            if(c>r){
                if(M2SITESITEVIS[r][c]==0){
                    str = GrabJSONCell(FirstJSON,Table2VisibilityRow+3*r-1,c+1).toString();
                    if(str.includes('Y') || str.includes('y')){
                        A2SiteSiteVIS[r][c] = true;
                    }
                    else if(str.includes('N') || str.includes('n')){
                        A2SiteSiteVIS[r][c] = false;
                    }
                    else{
                        A2SiteSiteVIS[r][c] = -1; //maybe this works?
                    }
                    SetBGColor(Table2VisibilityRow+3*r-1,c+1, "yellow");
                    if(b_zipping){
                        if(A2SiteSiteVIS[r][c]==K2SiteSiteVIS[r][c])
                            SetBGColor(Table2VisibilityRow+3*r-1,c+1, "green");
                        else
                            SetBGColor(Table2VisibilityRow+3*r-1,c+1, "red");
                    }
                }
                else{
                    SetBGColor(Table2VisibilityRow+3*r-1,c+1, "lightgray");
                }
                if(M2SITESITELOS[r][c]==0){
                    f = parseFloat(GrabJSONCell(FirstJSON,Table2VisibilityRow+3*r+1-1,c+1));
                    if(isNaN(f) || f < 0) f=0;
                    A2SiteSiteLOS[r][c] = f;
                    SetBGColor(Table2VisibilityRow+3*r+1-1,c+1, "yellow");
                    if(b_zipping){
                        if(CloseEnough(K2SiteSiteLOS[r][c],f))
                            SetBGColor(Table2VisibilityRow+3*r+1-1,c+1, "green");
                        else
                            SetBGColor(Table2VisibilityRow+3*r+1-1,c+1, "red");
                    }
                }
                else{
                    SetBGColor(Table2VisibilityRow+3*r+1-1,c+1, "lightgray");
                }
            }
        }
    }
    //Table 3
    for(i = 0; i < numcommlinks; i++){
        if(M3COMMLINK[i]==0){
            c = maplinktosam(i,true);
            r = maplinktosam(i,false);
            str = GrabJSONCell(FirstJSON,Table3CommLinkRow+r-1,c+1).toString();
            if(str.includes('Y') || str.includes('y')){
                A3commlinks[i] = true;
            }
            else if(str.includes('N') || str.includes('n')){
                A3commlinks[i] = false;
            }
            else{
                A3commlinks[i] = -1; //maybe this works?
            }
            SetBGColor(Table3CommLinkRow+r-1,c+1, "yellow");
            if(b_zipping){
                if(A3commlinks[i]==K3commlinks[i])
                    SetBGColor(Table3CommLinkRow+r-1,c+1, "green");
                else
                    SetBGColor(Table3CommLinkRow+r-1,c+1, "red");
            }
        }
        else{
            c = maplinktosam(i,true);
            r = maplinktosam(i,false);
            SetBGColor(Table3CommLinkRow+r-1,c+1, "lightgray");
        }
    }
    //Table 4
    for(r = 0; r < NUMSAMTYPES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M4RADARTYPEPOWERRANGE[r][c] == 0){
                f = parseFloat(GrabJSONCell(FirstJSON,Table4PowerRangeRow-1+r,c+1));
                if(isNaN(f) || f < 0) f=0;
                A4RADARTypePowerRange[r][c] = f;
                SetBGColor(Table4PowerRangeRow-1+r,c+1, "yellow");
                if(b_zipping){
                    if(CloseEnough(K4RADARTypePowerRange[r][c],f))
                        SetBGColor(Table4PowerRangeRow-1+r,c+1, "green");
                    else
                        SetBGColor(Table4PowerRangeRow-1+r,c+1, "red");
                }
            }
            else{
                SetBGColor(Table4PowerRangeRow-1+r,c+1, "lightgray");
            }
        }
    }
    //Table 5
    for(r = 0; r < NUMSITES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M5SITEACFTLOS[r][c] == 0){
                f = parseFloat(GrabJSONCell(FirstJSON,Table5RADARLOSRow-1+r,c+1));
                if(isNaN(f) || f < 0) f=0;
                A5SiteAcftLOS[r][c] = f;
                SetBGColor(Table5RADARLOSRow-1+r,c+1, "yellow");
                if(b_zipping){
                    if(CloseEnough(K5SiteAcftLOS[r][c],f))
                        SetBGColor(Table5RADARLOSRow-1+r,c+1, "green");
                    else
                        SetBGColor(Table5RADARLOSRow-1+r,c+1, "red");
                }
            }
            else{
                SetBGColor(Table5RADARLOSRow-1+r,c+1, "lightgray");
            }
        }
    }
    //Table 6
    for(r = 0; r < NUMSITES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M6SITEACFTDETRANGE[r][c] == 0){
                f = parseFloat(GrabJSONCell(FirstJSON,Table6RADARdetRow-1+r,c+1));
                if(isNaN(f) || f < 0) f=0;
                A6SiteAcftDetRange[r][c] = f;
                SetBGColor(Table6RADARdetRow-1+r,c+1, "yellow");
                if(b_zipping){
                    if(CloseEnough(K6SiteAcftDetRange[r][c],f))
                        SetBGColor(Table6RADARdetRow-1+r,c+1, "green");
                    else
                        SetBGColor(Table6RADARdetRow-1+r,c+1, "red");
                }
            }
            else{
                SetBGColor(Table6RADARdetRow-1+r,c+1, "lightgray");
            }
        }
    }
    //Table 7
    for(r = 0; r < NUMSAMTYPES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M7RADARTYPEACFTBURN[r][c] == 0){
                f = parseFloat(GrabJSONCell(FirstJSON,Table7BurnRow-1+r,c+1));
                if(isNaN(f) || f < 0) f=0;
                A7RADARTypeAcftBurn[r][c] = f;
                SetBGColor(Table7BurnRow-1+r,c+1, "yellow");
                if(b_zipping){
                    if(CloseEnough(K7RADARTypeAcftBurn[r][c],f))
                        SetBGColor(Table7BurnRow-1+r,c+1, "green");
                    else
                        SetBGColor(Table7BurnRow-1+r,c+1, "red");
                }
            }
            else{
                SetBGColor(Table7BurnRow-1+r,c+1, "lightgray");
            }
            for(var site = 0; site < NUMSITES; site++){
                if(ASAMTYPE[site] == r){
                    ASiteAcftBurnRange[site][c] = A7RADARTypeAcftBurn[r][c];
                }
            }
        }
    }
    //Table 8
    for(r = 0;r < NUMSAMTYPES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M8RADARTYPEACFTRWR[r][c] == 0){
                f = parseFloat(GrabJSONCell(FirstJSON,Table8RWRRow-1+r,c+1));
                if(isNaN(f) || f < 0) f=0;
                A8RADARTypeAcftRaw[r][c] = f;
                SetBGColor(Table8RWRRow-1+r,c+1, "yellow");
                if(b_zipping){
                    if(CloseEnough(K8RADARTypeAcftRaw[r][c],f))
                        SetBGColor(Table8RWRRow-1+r,c+1, "green");
                    else
                        SetBGColor(Table8RWRRow-1+r,c+1, "red");
                }
            }
            else{
                SetBGColor(Table8RWRRow-1+r,c+1, "lightgray");
            }
        }
    }
    //Table 9
    for(r = 0; r < 18; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            f = parseInt(GrabJSONCell(FirstJSON,Table9FPlanRow-1+r,c+1));
            if(isNaN(f) || f < 0) f=0;
            A9fplans[c][r] = f;
            SetBGColor(Table9FPlanRow-1+r,c+1, "yellow");
        }
    }
    //Table 10
    First_Package =  DecodeStringToPackage(GrabJSONCell(FirstJSON,Table10OrdersRow+1-1,1).toString());
    Second_Package = DecodeStringToPackage(GrabJSONCell(FirstJSON,Table10OrdersRow+2-1,1).toString());
    if(Second_Package == First_Package){
        Second_Package = -1;
    }
    EWJamming      = DecodeStringToPackage(GrabJSONCell(FirstJSON,Table10OrdersRow+3-1,1).toString());
    var inbound    = DecodeStringToPackage(GrabJSONCell(FirstJSON,Table10OrdersRow+4-1,1).toString());
    var outbound   = DecodeStringToPackage(GrabJSONCell(FirstJSON,Table10OrdersRow+5-1,1).toString());
    if(inbound >= 0){
        CyberInbound = true;
        CyberAttack = inbound;
    }
    else if(outbound >= 0){
        CyberInbound = false;
        CyberAttack = outbound;
    }
    else{
        CyberAttack = -1;
    }
    //Table 11 (still have some 10 names), HARM stuff
    HARMTargetList[0][0] = parseInt(GrabJSONCell(FirstJSON,Table10HARMRow+1-1,1))-1;
    HARMTargetList[0][1] = parseInt(GrabJSONCell(FirstJSON,Table10HARMRow+2-1,1))-1;
    HARMTargetList[1][0] = parseInt(GrabJSONCell(FirstJSON,Table10HARMRow+3-1,1))-1;
    HARMTargetList[1][1] = parseInt(GrabJSONCell(FirstJSON,Table10HARMRow+4-1,1))-1;
    
    //Logic:
    totalcost = ComputeCost();
    EnableAllValidSamsAndLinks();
    console.log(StudentSection,combinednames,"file loaded OK.");
}
//************************************ (2) RADIO BUTTONS **********************************
//REMOVED FEATURE
//************************************ (3) USER INTERFACE TAB, FLIGHT PLAN INTERACTION, TOGGLES **********************************
//this does not change the "whichpackage" variable, it only changes which tab is highlighted on the left tabs
function SetTabToPackage(){
    var TabName, tablinks, i;
    switch(whichPackage){
        case 0: TabName = 'TabConv';break;
        case 1: TabName = 'TabMix';break;
        case 2: TabName = 'TabStealth';break;
        default: break;
    }
    tablinks = document.getElementsByClassName("tablinks");
    for(i = 0; i < tablinks.length; i++){
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(TabName).className += " active";
}
function openTab(evt, whichTab){
    var i, tablinks;
    var rememberpackage = whichPackage;
    switch(whichTab){
        case 'TabConv':     whichPackage = 0; break;
        case 'TabMix':      whichPackage = 1; break;
        case 'TabStealth':  whichPackage = 2; break;
        default:            whichPackage = 0; break;
    }
    tablinks = document.getElementsByClassName("tablinks");
    for(i = 0; i < tablinks.length; i++){
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(whichTab).className += " active";
    //in response to a button click, update the canvas.
    if(rememberpackage != whichPackage){
        if(b_simulating){
            HaltSimulation();
        }
        b_showresults = false;
        UpdateCanvas();
    }
}
function SetViewTabsToDefault(){
    return; //for now, don't do defaults
    TurnDist(true);
    TurnLOS(false);
    TurnLinks(true);
    TurnRadar(true);
    TurnJam(true);
    TurnFPlan(true);
}
function toggleLOS(){
    TurnLOS(!vis_LOS);
    if(!b_simulating)
        UpdateCanvas();
}
function toggleDist(){
    TurnDist(!vis_Dist);
    if(!b_simulating)
        UpdateCanvas();
}
function toggleRadar(){
    TurnRadar(!vis_Radar);
    if(!b_simulating)
        UpdateCanvas();
}
function toggleJam(){
    TurnJam(!vis_Jam);
    if(!b_simulating)
        UpdateCanvas();
}
function toggleFPlan(){
    TurnFPlan(!vis_fplan);
    if(!b_simulating)
        UpdateCanvas();
}
function toggleLinks(){
    TurnLinks(!vis_Links);
    if(!b_simulating)
        UpdateCanvas();
}
function TurnLOS(setting){
    vis_LOS = setting;
    if(vis_LOS == true){
        document.getElementById("MaxLOS").className += " active";
    }
    else{ //in case the active gets duplicated, remove both with two calls to remove
        document.getElementById("MaxLOS").className = document.getElementById("MaxLOS").className.replace(" active","");
        document.getElementById("MaxLOS").className = document.getElementById("MaxLOS").className.replace(" active","");
    }
}
function TurnDist(setting){
    vis_Dist = setting;
    if(vis_Dist == true){
        document.getElementById("Distances").className += " active";
    }
    else{
        document.getElementById("Distances").className = document.getElementById("Distances").className.replace(" active","");
        document.getElementById("Distances").className = document.getElementById("Distances").className.replace(" active","");
    }
}
function TurnRadar(setting){
    vis_Radar = setting;
    if(vis_Radar == true){
        document.getElementById("MaxRadar").className += " active";
    }
    else{
        document.getElementById("MaxRadar").className = document.getElementById("MaxRadar").className.replace(" active","");
        document.getElementById("MaxRadar").className = document.getElementById("MaxRadar").className.replace(" active","");

    }
}
function TurnJam(setting){
    vis_Jam = setting;
    if(vis_Jam == true){
        document.getElementById("MinJam").className += " active";
    }
    else{
        document.getElementById("MinJam").className = document.getElementById("MinJam").className.replace(" active","");
        document.getElementById("MinJam").className = document.getElementById("MinJam").className.replace(" active","");

    }
}
function TurnLinks(setting){
    vis_Links = setting;
    if(vis_Links == true){
        document.getElementById("VisLinks").className += " active";
    }
    else{
        document.getElementById("VisLinks").className = document.getElementById("VisLinks").className.replace(" active","");
        document.getElementById("VisLinks").className = document.getElementById("VisLinks").className.replace(" active","");

    }
}
function TurnFPlan(setting){
    vis_fplan = setting;
    if(vis_fplan == true){
        document.getElementById("TogFPlan").className += " active";
    }
    else{
        document.getElementById("TogFPlan").className = document.getElementById("TogFPlan").className.replace(" active","");
        document.getElementById("TogFPlan").className = document.getElementById("TogFPlan").className.replace(" active","");

    }
}
//************************************ (4) SIMULATION **********************************
function EnableAllValidSamsAndLinks(){
    for(var i = 0; i < NUMSITES; i++){
        samdisabled[i] = true;
    }
    for(var i = 0; i < numcommlinks; i++){
        commDisabled[i] = false;
        //if student can see grade, set the links to the KEY instead of the STUDENT values to give the "sim" the keyed values.
        if(K3commlinks[i] && b_studentseesgrade || !b_studentseesgrade && A3commlinks[i]){
            var sam1 = maplinktosam(i,false);
            var sam2 = maplinktosam(i, true);
            samdisabled[sam1] = false;
            samdisabled[sam2] = false;
        }
    }
}
function StartSimulation(partialstep = 0.1){
    if(b_simulating){
        //then destroy the current timer
        clearInterval(v_interval);
    }
    n_simpartialstep = partialstep;
    if(b_gradermode == true){
        n_simpartialstep = n_instructor_speed;
    }
    b_success = false;
    SetViewTabsToDefault();
    //reset all sam-disabled and comm-link disabled possibilities
    EnableAllValidSamsAndLinks();
    ReloadHARMs();
    if(First_Package >= 0){
        v_interval = setInterval(DoSimulationStep, n_timeinterval);
        n_simstep = -1;
        n_simpartial = 0.5;
        b_simulating = true;
        b_showresults = false;
        b_success = false;
        whichPackage = First_Package;
        SetTabToPackage();
        ExitMessage = "";
        //interval will eventually lead to a draw called with doSimulationStep
    }
    else{
        //else, do a result message: no flight plan!
        ExitMessage = "No First Package Selected.";
        b_showresults = true;
        b_success = false;
        b_simulating = false;
        UpdateCanvas();
    }
}
function DoSimulationStep(){
    n_simpartial += n_simpartialstep;
    if(n_simpartial >= 1 || n_simstep < 0){
        n_simpartial = 0;
        n_simstep++;
        b_crossover = true;
    }
    else{
        b_crossover = false;
    }
    //check for last step of package
    if(n_simstep == 22 && whichPackage == Second_Package){
        //then we're done!
        clearInterval(v_interval);
        b_simulating = false;
        b_showresults = true;
        b_success = true;
        ExitMessage = "Simulation Complete.";
        var deduction = 0;
        for(var p = 0; p < NUMSTRIKES; p++){
            for(var shot = 0; shot < AHARMQTY[p]; shot++){
                if((p == First_Package || p == Second_Package) && HARMTargetList[p][shot] > -1){
                    deduction += POINTSHARM;
                }
            }
        }
        if(deduction > 0){
            ExitMessage += " "+ (deduction.toString()) + " points wil be deducted for HARM targeting.";
        }
        UpdateCanvas();
        return; //UpdateCanvas has an asynchronous call and this would remain on the stack. leave this function
    }
    else{
        if(n_simstep == 22 && whichPackage == First_Package){
            //go to the second package
            if(Second_Package >= 0){
                n_simstep = 0;
                whichPackage = Second_Package;
                SetTabToPackage();
            }
            else{
                ExitMessage = "Oops, no second package (cannot repeat a strike either).";
                HaltSimulation();
                UpdateCanvas();
                return; //UpdateCanvas has an asynchronous call and this would remain on the stack. leave this function
            }
        }
        myActiveWaypointIndex = StepToX[n_simstep];
        myActiveWaypointGridy = StepToY[n_simstep];
        myActiveWaypointInPlay = StepToT[n_simstep];
        if(n_simstep < 21){
            myNextWaypointIndex = StepToX[n_simstep+1];
            myNextWaypointGridy = StepToY[n_simstep+1];
        }
    }
    //check EW
    if(EWJamming == whichPackage){
        b_jamactive = true;
    }
    else{
        b_jamactive = false;
    }
    //check Cyber
    if(CyberAttack == whichPackage){
        if(n_simstep < FirstSouthbound){
            b_cyberactive = CyberInbound;
        }
        else{
            b_cyberactive = !CyberInbound;
        }
    }
    else{
        b_cyberactive = false;
    }
    UpdateCanvas(); //This is where most of the rules of the game are evaluated as it directly relates to how to draw on the canvas
}
function HaltSimulation(){
    console.log("Halted");
    ExitMessage += " Simulation Ended.";
    if(b_simulating == true){
        clearInterval(v_interval);
    }
    b_simulating = false;
    b_showresults = true;
    b_success = false;
}

//KONAMI https://stackoverflow.com/questions/31626852/how-to-add-konami-code-in-a-website-based-on-html w.stoettinger

// a key map of allowed keys
var allowedKeys = {
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    65: 'a',
    66: 'b'
  };
  
  // the 'official' Konami Code sequence
  var konamiCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
  
  // a variable to remember the 'position' the user has reached so far.
  var konamiCodePosition = 0;
  
  // add keydown event listener
  document.addEventListener('keydown', function(e) {
    // get the value of the key code from the key map
    var key = allowedKeys[e.keyCode];
    // get the value of the required key from the konami code
    var requiredKey = konamiCode[konamiCodePosition];
  
    // compare the key with the required key
    if (key == requiredKey) {
  
      // move to the next key in the konami code sequence
      konamiCodePosition++;
  
      // if the last key is reached, activate cheats
      if (konamiCodePosition == konamiCode.length) {
        activateCheats();
        konamiCodePosition = 0;
      }
    } else {
      konamiCodePosition = 0;
    }
  });
  
  function activateCheats() {
    alert("Cheats Activated!");
    document.getElementById("instr").style.display = "block";
  }

/**************************************************** COMPUTE FUNCTIONS ********************************/
//these functions reference CONFIG data entirely
const grademargin = 0.01; //as a ratio. 0.01 means 1% difference from answer. An answer of 0.0 is not allowed
const grademarginpartialcredit = 0.02 //if outside grademargin, partial credit tolerance (this is not implemented)
const FEEDROWS = 1000;
const FEEDCOLS = 20;
function cleardatafeed(){
    for(var i = 1; i < FEEDROWS; i++){
        //row 0 is not reset, it has the headers as spec'd when this was declared
        for(var j = 0; j < FEEDCOLS; j++){
            datafeed[i][j] = "";
        }
    }
    htmlfeed[i] = "";
}
let datafeed = new Array(FEEDROWS);
let htmlfeed = [];
let htmlfeedfilename = [];

for(var t = 0; t < FEEDROWS; t++){
    datafeed[t] = new Array(FEEDCOLS);
    datafeed[0][0] = "Filename";
    datafeed[0][1] = "Section";
    datafeed[0][2] = "Last";
    datafeed[0][3] = "First";
    datafeed[0][4] = "Table 1";
    datafeed[0][5] = "Table 2";
    datafeed[0][6] = "Table 3";
    datafeed[0][7] = "Table 4";
    datafeed[0][8] = "Table 5";
    datafeed[0][9] = "Table 6";
    datafeed[0][10] = "Table 7";
    datafeed[0][11] = "Table 8";
    datafeed[0][12] = "Mission";
    datafeed[0][13] = "Score";
}
//function GetInstructorMode(){
//    return true;
//}
function ComputeCommTypePowerRange(Txradio,Rxradio){ //this is range based on power
    return (SOL/FCOMM)/FOURPI*Math.sqrt(ACOMMPT[Txradio]/ACOMMPR[Rxradio]*ACOMMG[Txradio]*ACOMMG[Rxradio])/1000.0;
}
function ComputeSiteSeparation(radio1, radio2){ //provide the index 0..4 of the radio site
    var xdist = kmpergrid*(ASAMX[radio1]-ASAMX[radio2]);
    var ydist = kmpergrid*(ASAMY[radio1]-ASAMY[radio2]);
    return Math.sqrt(xdist*xdist + ydist*ydist);
}
function ComputeSiteMaxLOS(radio1, radio2){
    return KMPERMILE*(Math.sqrt(2*ASAMH[radio1])+Math.sqrt(2*ASAMH[radio2]));
}
function ComputeCommLink(link){ //true if the link should be active based on config data
    var radio1 = maplinktosam(link, true);
    var radio2 = maplinktosam(link, false);
    var samtype1 = ASAMTYPE[radio1];
    var samtype2 = ASAMTYPE[radio2];
    var R_Power = ComputeCommTypePowerRange(samtype1, samtype2);
    var R_Sep   = ComputeSiteSeparation(radio1, radio2);
    var R_LOS   = ComputeSiteMaxLOS(radio1, radio2);
    if(R_Sep < R_LOS && R_Sep < R_Power){
        return true;
    }
    else{
        return false;
    }
}
function ComputeRADARTypePowerRange(whichsamtype, whichaircraft){
    let lambda = SOL / FRADAR;
    let powerratio = ARADPT[whichsamtype]/ARADPR[whichsamtype];
    let gainproduct = ARADG[whichsamtype]*ARADG[whichsamtype];
    return Math.sqrt(Math.sqrt(powerratio*gainproduct*ARCS[whichaircraft]*lambda*lambda/(FOURPICUBE)))/1000.0;
}
function ComputeSiteStrikeLOS(site,strike){
    return KMPERMILE*(Math.sqrt(2*ASAMH[site])+Math.sqrt(2*AALT[strike]));
}
function ComputeSiteStrikeDetRange(site,strike){
    let samtype = ASAMTYPE[site];
    let R_Power = ComputeRADARTypePowerRange(samtype, strike);
    let R_LOS   = ComputeSiteStrikeLOS(site,strike);
    return Math.min(R_Power, R_LOS);
}
function ComputeRADARTypeStrikeBurn(samtype, strike){
    //an assumption here is that burn through occurs inside the R_LOS distance. Program will allow
    //radar stations with nuclear-power-plant levels of power to destory aircraft beyond line-of-sight
    //and thats probably fine.
    //return 40;
    return Math.sqrt(ARADPT[samtype]/AJAMPT[strike]*ARADG[samtype]/AJAMGT[strike]*ARCS[strike]/FOURPI/ARADSNR[samtype])/1000.0;
}
function ComputeRADARTypeStrikeRWR(samtype, strike){
    let lambda = SOL / FRADAR;
    let powerratio = ARADPT[samtype] / ARWRPR[strike];
    let gainproduct = ARADG[samtype] * ARWRG[strike];
    return lambda/FOURPI*Math.sqrt(powerratio*gainproduct)/1000.0;
}
function GenerateOutputFile(alloutmode = false){
    //if alloutmode is true, then this GenerateOutputFile function will give a full output of template + student data, as for saving an output
    //according to the mask, the student cannot modify the template data
    var filename = "template.xlsx";
    if(alloutmode == true){
        filename = "AnswerKey.xlsx";
    }
    var bigrows = 120;
    var bigcols = 10;
    var data = new Array(120);
    var r,c, i, bo, yn;
    var tempstring;
    for(r = 0; r < bigrows; r++){
        data[r] = new Array(bigcols);
        for(c = 0; c < bigcols; c++){
            data[r][c] = "";
        }
    }
    //columns:
    for(c = 0; c < bigcols; c++) data[0][c] = "Col"+c.toString();
    //Names:
    console.log(NameRow);
    data[NameRow-2][0] = "Student Name(s):";
    data[NameRow-1][1] = "Last:";
    data[NameRow-1][2] = "First:";
    for(r = 0; r < STUDENTSPERGROUP; r++){
        data[NameRow+r][0] = "Name:"
        data[NameRow+r][1] = A0StudentNames[r][0];
        data[NameRow+r][2] = A0StudentNames[r][1];
    }
    //Table 1
    data[Table1CommRangeRow-2][0]=TABLENAMES[0];
    for(c = 0; c < NUMSAMTYPES; c++) data[Table1CommRangeRow-1][c+1]="Type "+ASAMNAMES[c].toString();
    for(r = 0; r < NUMSAMTYPES; r++){
        data[Table1CommRangeRow+r][0] = "Type "+ASAMNAMES[r].toString();
        for(c=0; c<NUMSAMTYPES; c++){
            if(M1COMMTYPEPOWERRANGE[r][c]==1 || alloutmode == true){
                data[Table1CommRangeRow+r][c+1] = A1CommTypePowerRange[r][c];
            }
        }
    }
    //Table 2
    data[Table2VisibilityRow-2][0]=TABLENAMES[1];
    for(c = 0; c < NUMSITES; c++){
        tempstring = ASAMH[c].toString();
        data[Table2VisibilityRow-1][c+1]=tempstring+" ft Hill";
    }
    for(r = 0; r < NUMSITES-1; r++){
        tempstring = ASAMH[r].toString();
        data[Table2VisibilityRow+r*3][0] = tempstring+" ft Hill";
        data[Table2VisibilityRow+r*3+1][0] = "LOS Range (km)";
        data[Table2VisibilityRow+r*3+2][0] = "Separation (km)";
        for(c=0; c<NUMSITES; c++){
            if(c<=r){
                data[Table2VisibilityRow+3*r][c+1] = "X";    
                data[Table2VisibilityRow+3*r+1][c+1] = "X";
                data[Table2VisibilityRow+3*r+2][c+1] = "X";
            }
            else{
                data[Table2VisibilityRow+r*3+2][c+1] = A2SiteSiteSEP[r][c];
                if(M2SITESITEVIS[r][c]==1 || alloutmode == true){
                    bo = A2SiteSiteVIS[r][c];
                    if(bo == true) yn = "YES";
                    else yn = "NO";
                    data[Table2VisibilityRow+r*3][c+1] = yn;
                    data[Table2VisibilityRow+r*3+1][c+1] = A2SiteSiteLOS[r][c];
                }
            }
        }
    }
    //Table 3
    data[Table3CommLinkRow-2][0] = TABLENAMES[2];
    for(i = 0; i < NUMSITES; i++){
        tempstring = ASAMH[i].toString();
        tempstring += " ft hill w/"+ASAMNAMES[ASAMTYPE[i]];
        data[Table3CommLinkRow-1][i+1] = tempstring;
        data[Table3CommLinkRow+i][0] = tempstring;
    }
    data[Table3CommLinkRow+NUMSITES-1][0]="";
    for(r = 0; r < NUMSITES-1; r++){
        for(c = 0; c < NUMSITES; c++){
            if(c<=r) data[Table3CommLinkRow+r][c+1] = "X";
        }
    }
    for(i = 0; i < numcommlinks; i++){
        c = maplinktosam(i,true);
        r = maplinktosam(i,false);
        if(M3COMMLINK[i] == 1 || alloutmode == true){
            if(A3commlinks[i] == true)
                data[Table3CommLinkRow+r][c+1] = "YES";
            else
                data[Table3CommLinkRow+r][c+1] = "NO";
        }
    }
    //Table 4
    data[Table4PowerRangeRow-2][0] = TABLENAMES[3];
    for(i = 0; i < NUMSAMTYPES; i++) data[Table4PowerRangeRow+i][0] = "Type "+ASAMNAMES[i];
    for(i = 0; i < NUMSTRIKES; i++) data[Table4PowerRangeRow-1][1+i] = ASTRIKENAMES[i];
    for(r = 0; r <  NUMSAMTYPES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M4RADARTYPEPOWERRANGE[r][c] == 1 || alloutmode == true)
                data[Table4PowerRangeRow+r][c+1] = A4RADARTypePowerRange[r][c];
        }
    }
    //Table 5
    data[Table5RADARLOSRow-2][0] = TABLENAMES[4];
    for(i = 0; i < NUMSTRIKES; i++) data[Table5RADARLOSRow-1][1+i] = ASTRIKENAMES[i];
    for(i = 0; i < NUMSITES; i++)   data[Table5RADARLOSRow+i][0]   = ASAMH[i].toString() + " ft Hill";
    for(r = 0; r < NUMSITES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M5SITEACFTLOS[r][c] == 1 || alloutmode == true)
                data[Table5RADARLOSRow+r][1+c] = A5SiteAcftLOS[r][c];
        }
    }
    //Table 6
    data[Table6RADARdetRow-2][0] = TABLENAMES[5];
    for(i = 0; i < NUMSTRIKES; i++) data[Table6RADARdetRow-1][1+i] = ASTRIKENAMES[i];
    for(i = 0; i < NUMSITES; i++)   data[Table6RADARdetRow+i][0]   = ASAMH[i].toString() + " ft Hill w/ "+ASAMNAMES[ASAMTYPE[i]];
    for(r = 0; r < NUMSITES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M6SITEACFTDETRANGE[r][c] == 1 || alloutmode == true)
                data[Table6RADARdetRow+r][1+c] = A6SiteAcftDetRange[r][c];
        }
    }
    //Table 7  Table 7: Burn-Through Range (km)
    data[Table7BurnRow-2][0] = TABLENAMES[6];
    for(i = 0; i < NUMSTRIKES; i++) data[Table7BurnRow-1][1+i] = ASTRIKENAMES[i];
    for(i = 0; i < NUMSAMTYPES; i++)   data[Table7BurnRow+i][0] = "Type "+ASAMNAMES[i];
    for(r = 0; r < NUMSAMTYPES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M7RADARTYPEACFTBURN[r][c] == 1 || alloutmode == true)
                data[Table7BurnRow+r][1+c] = A7RADARTypeAcftBurn[r][c];
        }
    }
    //Table 8: RADAR Warning Receiver Range (km) by Power
    data[Table8RWRRow-2][0] = TABLENAMES[7];
    for(i = 0; i < NUMSTRIKES; i++) data[Table8RWRRow-1][1+i] = ASTRIKENAMES[i];
    for(i = 0; i < NUMSAMTYPES; i++)   data[Table8RWRRow+i][0] = "Type "+ASAMNAMES[i];
    for(r = 0; r < NUMSAMTYPES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M8RADARTYPEACFTRWR[r][c] == 1 || alloutmode == true)
                data[Table8RWRRow+r][1+c] = A8RADARTypeAcftRaw[r][c];
        }
    }
    //Table 9: Flight Plans
    data[Table9FPlanRow-2][0] = TABLENAMES[8];
    var letters = "ABCDEFGHIIHGFEDCBA";
    for(i = 0; i < NUMSTRIKES; i++) data[Table9FPlanRow-1][1+i] = ASTRIKENAMES[i];
    for(i = 0; i < 18; i++) data[Table9FPlanRow+i][0] = letters.charAt(i);
    //for(r = 0; r < 18; r++){
    //    for(c = 0; c < NUMSTRIKES; c++){
            //data[Table9FPlanRow][c+1] = fplans[c][r]; //vertical not horizontal :/ column-row order 
            //there is no data to enter as an answer key and no mask
    //    }
    //}
    //Table 10: ACO, ATO Data
    data[Table10OrdersRow][0] = TABLENAMES[9];
    data[Table10OrdersRow+1][0] = "First Strike:";
    data[Table10OrdersRow+2][0] = "Second Strike:";
    data[Table10OrdersRow+3][0] = "EW Jamming (good for inbound and outbound):";
    data[Table10OrdersRow+4][0] = "Cyber Attack Inbound:";
    data[Table10OrdersRow+5][0] = "Cyber Attack Outbound (cannot also select inbound):";
    for(i = 0; i < 5; i++) data[Table10OrdersRow+i+1][1] = "N";
    //Table 11: HARM Target list
    data[Table10HARMRow][0] = TABLENAMES[10];
    data[Table10HARMRow+1][0] = "Conventional First Target:";
    data[Table10HARMRow+2][0] = "Conventional Second Target:";
    data[Table10HARMRow+3][0] = "Mixed First Target:";
    data[Table10HARMRow+4][0] = "Mixed Second Target:";
    for(i = 0; i < 4; i++) data[Table10HARMRow+i+1][1] = 0;
    //Finalize to the worksheet
    var ws_name = "Sheet1";
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, filename);
}
//End GenerateOutputFile()
//Not using events. end of simulation will trigger ScoreCurrentFile which restarts the loop
var zipfile;
var b_zipping;
var bordercolapse = '<style>table, th, td {border-collapse: collapse;}</style>';
var headertobody = '<html><head><meta charset="utf-8"/><title>Export</title></head>'+bordercolapse+'<body>';
var closeitup = '</body></html>';
var indexfilecontent;

function BatchGradeFiles(){ //only called  at beginning of grading sequence.
    cleardatafeed();
    b_zipping = true;
    zipfile = new JSZip();
    indexfilecontent = headertobody;
    b_gradermode = true;
    filestograde = event.target.files;
    howmanyfilesarethere = filestograde.length;
    isthereafiletograde = true;
    whichfiletograde = 0;
    LoadXLSXFile();
}
function CloseEnough(correct,test){ //correct value and test value. don't pass zero intentionally
    if(correct == 0){
        if(test == 0){
            return true;
        }
        else return false;
    }
    var diff = test-correct;
    if(diff < 0){
        diff = - diff;
    }
    var ratio = diff/correct;
    if(ratio < grademargin){
        return true;
    }
    else{
        return false;
    }
}
function feedbackmessage(whichtable,row,column,keyvalue,studentvalue){
    //console.log(whichtable,row,column,keyvalue,studentvalue);
    var str = "Row:"+(row+1).toString()+",Col:"+(column+1).toString()+",";
    str += studentvalue.toString();
    return str;
}
function ScoreCurrentFile(){
    //1. compute a grade....
    var feedback = ["","","","","","","","","",""]; //10 items: 8 tables + 9th for exit message with harm missiles, and 10th for score
    var score = 0;
    var checked = 0;
    var studentvalue, correctvalue;
    feedback[8] = ExitMessage;
    if(b_success){
        score += POINTSSUCCESS;
    }
    b_success = false;
    var i, r, c;
    for(r = 0; r < 5; r++){
        for(c = 0; c < 5; c++){
            if(r < NUMSAMTYPES && c < NUMSAMTYPES && M1COMMTYPEPOWERRANGE[r][c]==0){
                checked++;
                correctvalue = K1CommTypePowerRange[r][c];
                studentvalue = A1CommTypePowerRange[r][c];
                if(CloseEnough(correctvalue,studentvalue)){
                    score += P1COMMTYPEPOWERRANGE;
                    //console.log("table1+");
                }
                else{
                    feedback[1-1]+=feedbackmessage(1,r,c,correctvalue,studentvalue);
                }
            }
            if(r < NUMSITES && c < NUMSITES){
                if(M2SITESITEVIS[r][c]==0){
                    checked++;
                    correctvalue = K2SiteSiteVIS[r][c];
                    studentvalue = A2SiteSiteVIS[r][c];
                    if(correctvalue == studentvalue){
                        score += P2SITESITEVIS;
                        //console.log("table2+");
                    }
                    else{
                        feedback[2-1]+=feedbackmessage(2,r,c,correctvalue,studentvalue);
                    }
                }
                if(M2SITESITELOS[r][c]==0){
                    checked++;
                    correctvalue = K2SiteSiteLOS[r][c];
                    studentvalue = A2SiteSiteLOS[r][c];
                    if(CloseEnough(correctvalue,studentvalue)){
                        score += P2SITESITELOS;
                        //console.log("table2LOS+");
                    }
                    else{
                        feedback[2-1]+=feedbackmessage(2,r,c,correctvalue,studentvalue);
                    }
                }
            }
            if(r < NUMSAMTYPES && c < NUMSTRIKES){
                if(M4RADARTYPEPOWERRANGE[r][c]==0){
                    checked++;
                    correctvalue = K4RADARTypePowerRange[r][c];
                    studentvalue = A4RADARTypePowerRange[r][c];
                    if(CloseEnough(correctvalue,studentvalue)){
                        score += P4RADARTYPEPOWERRANGE;
                        //console.log("table4+");
                    }
                    else{
                        feedback[4-1]+=feedbackmessage(4,r,c,correctvalue,studentvalue);
                    }
                }
                if(M7RADARTYPEACFTBURN[r][c]==0){
                    checked++;
                    correctvalue = K7RADARTypeAcftBurn[r][c];
                    studentvalue = A7RADARTypeAcftBurn[r][c];
                    if(CloseEnough(correctvalue,studentvalue)){
                        score += P7RADARTYPEACFTBURN;
                        //console.log("table7+");
                    }
                    else{
                        feedback[7-1]+=feedbackmessage(7,r,c,correctvalue,studentvalue);
                    }
                }
                if(M8RADARTYPEACFTRWR[r][c]==0){
                    checked++;
                    correctvalue = K8RADARTypeAcftRaw[r][c];
                    studentvalue = A8RADARTypeAcftRaw[r][c];
                    if(CloseEnough(correctvalue,studentvalue)){
                        score += P8RADARTYPEACFTRWR;
                        //console.log("table8+");
                    }
                    else{
                        feedback[8-1]+=feedbackmessage(8,r,c,correctvalue,studentvalue);
                    }
                }
            }
            if(r < NUMSITES && c < NUMSTRIKES){
                if(M5SITEACFTLOS[r][c]==0){
                    checked++;
                    correctvalue = K5SiteAcftLOS[r][c];
                    studentvalue = A5SiteAcftLOS[r][c];
                    if(CloseEnough(correctvalue,studentvalue)){
                        score += P5SITEACFTLOS;
                        //console.log("table5+");
                    }
                    else{
                        feedback[5-1]+=feedbackmessage(5,r,c,correctvalue,studentvalue);
                    }
                }
                if(M6SITEACFTDETRANGE[r][c]==0){
                    checked++;
                    correctvalue = K6SiteAcftDetRange[r][c];
                    studentvalue = A6SiteAcftDetRange[r][c];
                    if(CloseEnough(correctvalue,studentvalue)){
                        score += P6SITEACFTDETRANGE;
                        //console.log("table6+");
                    }
                    else{
                        feedback[6-1]+=feedbackmessage(6,r,c,correctvalue,studentvalue);
                    }
                }
            }
        }
    }
    for(i = 0; i < numcommlinks; i++){
        if(M3COMMLINK[i]==0){
            checked++;
            correctvalue = K3commlinks[i];
            studentvalue = A3commlinks[i];
            //console.log(checked,studentvalue,correctvalue);
            if(correctvalue == studentvalue){
                score += P3COMMLINKS;
                //console.log("table3+");
            }
            else{
                feedback[3-1]+="("+(maplinktosam(i,false)+1).toString()+","+(maplinktosam(i,true)+1).toString()+") is incorrect. ";
            } 
        }
    }
    for(r = 0; r < 2; r++){
        for(c = 0; c < 2; c++){
            if(HARMTargetList[r][c] >= 0){
                feedback[8] += POINTSHARM.toString() + " deducted for HARM shot. ";
                //penalize whether fired or not. :\
                score -= POINTSHARM;
                //console.log("harm-");
            }
        }
    }
    feedback[9] = score.toString();
    document.getElementById("studentscore").textContent = score.toString();
    var currentfilename;
    if(b_gradermode)
        currentfilename = filestograde[whichfiletograde].name;
    else
        currentfilename = studentsfile.name;
    console.log(currentfilename);
    //console.log(feedback);
    //push to datafeed for eventual output
    for(var stu = 0; stu < STUDENTSPERGROUP; stu++){
        var thisrow = 1+stu+whichfiletograde*STUDENTSPERGROUP;
        datafeed[thisrow][0] = currentfilename;
        datafeed[thisrow][1] = StudentSection;
        datafeed[thisrow][2] = A0StudentNames[stu][0];
        datafeed[thisrow][3] = A0StudentNames[stu][1];
        for(var cats = 0; cats < feedback.length; cats++ ){
            datafeed[thisrow][cats+4] = feedback[cats];
        }
        if(b_zipping){
            document.getElementById('data-table').style.display = "block";
            var p_score = '<p><b>Score: '+score+' pts. Simulation Report: '+ExitMessage+"</b></p>";
            var htmlcontent = headertobody+p_score+document.getElementById('data-table').outerHTML+closeitup;
            document.getElementById('data-table').style.display = "none";
            var htmlfilename = StudentSection+"-"+A0StudentNames[stu][0]+whichfiletograde+".html";
            zipfile.file(htmlfilename,htmlcontent);
            indexfilecontent+="<br><a href="+htmlfilename+">"+htmlfilename+"</a> score: "+score+" exit: "+ExitMessage;
        }
    }
    whichfiletograde += 1;
    if(whichfiletograde < howmanyfilesarethere){
        //b_gradermode = true;
        //isthereafiletograde = true;
        LoadXLSXFile();
    }
    else{
        //done
        isthereafiletograde = false;
        b_gradermode = false;
        b_zipping = false;
        indexfilecontent+=closeitup;
        zipfile.file("contents.html",indexfilecontent);
        zipfile.file("readme.txt","1. Unzip this archive. 2. Open contents.html");
        document.getElementById("savexlsx-btn").disabled = false;
        document.getElementById("savehtml-btn").disabled = false;
    }
}
function SaveGradesToFile(){
    var filename = "grades.xlsx";
    //Finalize to the worksheet
    var ws_name = "Sheet1";
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(datafeed);
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, filename);
}
var n_instructor_speed;
n_instructor_speed = 0.1;
function SpeedUp(){
    n_instructor_speed = 0.55;
    n_simpartialstep = n_instructor_speed;
}

function GenerateSpecFile(){
    var filename = "spec.html";
    var element = document.createElement('a');
    element.setAttribute('href', 'data:html;charset=utf-8,' + encodeURIComponent(htmlfeed[1]));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function emptySlots(which){
    var count = 0;
    for(var i = 0; i < which.length; i++){
        if(which[i] == 0 || which[i] == 1){
            if(which[i] == 0){
                count++;
            }
        }
        else{
            for(var j = 0; j < which[i].length; j++){
                if(which[i][j] == 0){
                    count++;
                }
            }
        }
    }
    return count;
}
function pointsAvailable(){
    var points = [];
    var allpoints = [
        P1COMMTYPEPOWERRANGE,
        P2SITESITELOS+P2SITESITEVIS,
        P3COMMLINKS,
        P4RADARTYPEPOWERRANGE,
        P5SITEACFTLOS,
        P6SITEACFTDETRANGE,
        P7RADARTYPEACFTBURN,
        P8RADARTYPEACFTRWR,
    ]
    var allmasks = [
        M1COMMTYPEPOWERRANGE,
        M2SITESITELOS,
        M3COMMLINK,
        M4RADARTYPEPOWERRANGE,
        M5SITEACFTLOS,
        M6SITEACFTDETRANGE,
        M7RADARTYPEACFTBURN,
        M8RADARTYPEACFTRWR
    ];
    var total = 0;
    for(var i = 0; i < allmasks.length; i++){
        points.push(allpoints[i]*emptySlots(allmasks[i]));
        total += points[i];
    }
    points.push(POINTSSUCCESS);
    points.push(0);
    points.push(0);
    total += POINTSSUCCESS;
    points.push(total);
    return points;
}

function InitDescription(){
    var table = document.getElementById("d-grading-table");
    var ptable = pointsAvailable();
    var totalpts = ptable[ptable.length-1];
    document.getElementById("d-points-total").textContent = totalpts.toString();
    for(var i = 0; i < 11; i++){
        var row = table.insertRow(i);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var pts = ptable[i];
        var shortname = TABLENAMES[i].split('(')[0];
        cell1.innerHTML = shortname;
        cell2.innerHTML = pts + " pts";
        if(pts == 0) cell2.innerHTML = "";
    }
    var mpqradiotable = document.getElementById("mpqradiotable");
    for(var i = 0; i < NUMSAMTYPES; i++){
        var row = mpqradiotable.insertRow();

        var cell0 = row.insertCell();
        var cell1 = row.insertCell();
        var cell2 = row.insertCell();
        var cell3 = row.insertCell();
        var cell4 = row.insertCell();

        cell0.innerHTML = ASAMNAMES[i];
        cell1.innerHTML = FCOMM/1000000+" MHz";
        cell2.innerHTML = ACOMMG[i];
        cell3.innerHTML = ACOMMPT[i]+" W";
        cell4.innerHTML = ACOMMPR[i]*1000000000+" nW";
    }
    var mpqradartable = document.getElementById("mpqradartable");
    for(var i = 0; i < NUMSAMTYPES; i++){
        var row = mpqradartable.insertRow();
        
        var cell0 = row.insertCell();
        var cell1 = row.insertCell();
        var cell2 = row.insertCell();
        var cell3 = row.insertCell();
        var cell4 = row.insertCell();
        var cell5 = row.insertCell();

        cell0.innerHTML = ASAMNAMES[i];
        cell1.innerHTML = FRADAR/1000000000+" GHz";
        cell2.innerHTML = ARADG[i];
        cell3.innerHTML = ARADPT[i]/1000+" kW";
        cell4.innerHTML = ARADPR[i]*1000000000000000+" fW";
        cell5.innerHTML = ARADSNR[i];

    }
    var acftcapstable = document.getElementById("acftcapstable");
    var compositions = ["1xEA-18G + 2xF-15E","1xF-16CJ+2xF-35","2xF-22"];
    for(var i = 0; i < NUMSTRIKES; i++){
        var row = acftcapstable.insertRow();
        var cell0 = row.insertCell();
        var cell1 = row.insertCell();
        var cell2 = row.insertCell();
        var cell3 = row.insertCell();
        var cell4 = row.insertCell();
        var cell5 = row.insertCell();
        cell0.innerHTML = ASTRIKENAMES[i].replace("_"," ");
        cell1.innerHTML = compositions[i];
        cell2.innerHTML = ARCS[i]+" m<sup>2</sup>";
        cell3.innerHTML = AALT[i]+" ft";
        cell4.innerHTML = "YES";
        if(i == 2) cell4.innerHTML = "NO";
        cell5.innerHTML = "$"+ACOST[i];
    }
    var acftrwrtable = document.getElementById("acftrwrtable");
    for(var i = 0; i < NUMSTRIKES; i++){
        var row = acftrwrtable.insertRow();
        var cell0 = row.insertCell();
        var cell1 = row.insertCell();
        var cell2 = row.insertCell();
        var cell3 = row.insertCell();

        cell0.innerHTML = ASTRIKENAMES[i].replace("_"," ");
        cell1.innerHTML = FRADAR/1000000000+" GHz";
        cell2.innerHTML = ARWRG[i];
        cell3.innerHTML = ARWRPR[i]*1000000000+" nW";
    }
    var acftjammertable = document.getElementById("acftjammertable");
    for(var i = 0; i < NUMSTRIKES; i++){
        var row = acftjammertable.insertRow();
        var cell0 = row.insertCell();
        var cell1 = row.insertCell();
        var cell2 = row.insertCell();
        var cell3 = row.insertCell();

        cell0.innerHTML = ASTRIKENAMES[i].replace("_"," ");
        cell1.innerHTML = FRADAR/1000000000+" GHz";
        cell2.innerHTML = AJAMGT[i];
        cell3.innerHTML = AJAMPT[i]+" W";
    }
    console.log("fin");
}

function SaveZippedHTML(){
    zipfile.generateAsync({type:"blob"}).then(function(content){
        saveAs(content,"archive.zip");
    });
}