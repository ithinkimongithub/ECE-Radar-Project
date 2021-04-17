"use strict";
//This is the Instructor file and contains COMPUTE FUNCTIONS 
// and the GenerateOutputFile function
/**************************************************** COMPUTE FUNCTIONS ********************************/
//these function reference CONFIG data entirely
const grademargin = 0.01; //as a ratio. 0.01 means 1% difference from answer. An answer of 0.0 is not allowed
const grademarginpartialcredit = 0.02 //if outside grademargin, partial credit tolerance (not implemented)
const FEEDROWS = 1000;
const FEEDCOLS = 20;
function cleardatafeed(){
    for(var i = 1; i < FEEDROWS; i++){
        //row 0 is not reset, it has the headers as spec'd when this was declared
        for(var j = 0; j < FEEDCOLS; j++){
            datafeed[i][j] = "";
        }
    }
}
let datafeed = new Array(1000);
for(var t = 0; t < 1000; t++){
    datafeed[t] = new Array(20);
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
function GetInstructorMode(){
    return true;
}
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
    data[NameRow-2][0] = "Student Names:";
    data[NameRow-1][1] = "Last:";
    data[NameRow-1][2] = "First:";
    for(r = 0; r < STUDENTSPERGROUP; r++){
        data[NameRow+r][0] = "Name:"
        data[NameRow+r][1] = A0StudentNames[r][0];
        data[NameRow+r][2] = A0StudentNames[r][1];
    }
    //Table 1
    data[Table1CommRangeRow-2][0]="Table 1: Radio to Radio Communication Range (km)";
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
    data[Table2VisibilityRow-2][0]="Table 2: Site to Site Separation & Visibility (km)";
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
    data[Table3CommLinkRow-2][0] = "Table 3: Deployed IADS Communication Links (YES/NO)";
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
    data[Table4PowerRangeRow-2][0] = "Table 4: RADAR to Aircraft Detection Range (km)";
    for(i = 0; i < NUMSAMTYPES; i++) data[Table4PowerRangeRow+i][0] = "Type "+ASAMNAMES[i];
    for(i = 0; i < NUMSTRIKES; i++) data[Table4PowerRangeRow-1][1+i] = ASTRIKENAMES[i];
    for(r = 0; r <  NUMSAMTYPES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M4RADARTYPEPOWERRANGE[r][c] == 1 || alloutmode == true)
                data[Table4PowerRangeRow+r][c+1] = A4RADARTypePowerRange[r][c];
        }
    }
    //Table 5
    data[Table5RADARLOSRow-2][0] = "Table 5: Site to Aircraft Visibility (km)";
    for(i = 0; i < NUMSTRIKES; i++) data[Table5RADARLOSRow-1][1+i] = ASTRIKENAMES[i];
    for(i = 0; i < NUMSITES; i++)   data[Table5RADARLOSRow+i][0]   = ASAMH[i].toString() + " ft Hill";
    for(r = 0; r < NUMSITES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M5SITEACFTLOS[r][c] == 1 || alloutmode == true)
                data[Table5RADARLOSRow+r][1+c] = A5SiteAcftLOS[r][c];
        }
    }
    //Table 6
    data[Table6RADARdetRow-2][0] = "Table 6: Deployed IADS Aircraft Detection Range (km)";
    for(i = 0; i < NUMSTRIKES; i++) data[Table6RADARdetRow-1][1+i] = ASTRIKENAMES[i];
    for(i = 0; i < NUMSITES; i++)   data[Table6RADARdetRow+i][0]   = ASAMH[i].toString() + " ft Hill w/ "+ASAMNAMES[ASAMTYPE[i]];
    for(r = 0; r < NUMSITES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M6SITEACFTDETRANGE[r][c] == 1 || alloutmode == true)
                data[Table6RADARdetRow+r][1+c] = A6SiteAcftDetRange[r][c];
        }
    }
    //Table 7  Table 7: Burn-Through Range (km)
    data[Table7BurnRow-2][0] = "Table 7: RADAR Burn-Through Range (km)";
    for(i = 0; i < NUMSTRIKES; i++) data[Table7BurnRow-1][1+i] = ASTRIKENAMES[i];
    for(i = 0; i < NUMSAMTYPES; i++)   data[Table7BurnRow+i][0] = "Type "+ASAMNAMES[i];
    for(r = 0; r < NUMSAMTYPES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M7RADARTYPEACFTBURN[r][c] == 1 || alloutmode == true)
                data[Table7BurnRow+r][1+c] = A7RADARTypeAcftBurn[r][c];
        }
    }
    //Table 8: RADAR Warning Receiver Range (km) by Power
    data[Table8RWRRow-2][0] = "Table 8: Aircraft RWR Range (km)";
    for(i = 0; i < NUMSTRIKES; i++) data[Table8RWRRow-1][1+i] = ASTRIKENAMES[i];
    for(i = 0; i < NUMSAMTYPES; i++)   data[Table8RWRRow+i][0] = "Type "+ASAMNAMES[i];
    for(r = 0; r < NUMSAMTYPES; r++){
        for(c = 0; c < NUMSTRIKES; c++){
            if(M8RADARTYPEACFTRWR[r][c] == 1 || alloutmode == true)
                data[Table8RWRRow+r][1+c] = A8RADARTypeAcftRaw[r][c];
        }
    }
    //Table 9: Flight Plans
    data[Table9FPlanRow-2][0] = "Table 9: Flight Plans (Fill out at least 2 columns with numbers 1..9";
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
    data[Table10OrdersRow][0] = "Table 10: Orders List (Specify N for None, C for Conventional, M for Mixed, or S for Stealth";
    data[Table10OrdersRow+1][0] = "First Strike:";
    data[Table10OrdersRow+2][0] = "Second Strike:";
    data[Table10OrdersRow+3][0] = "EW Jamming (good for inbound and outbound):";
    data[Table10OrdersRow+4][0] = "Cyber Attack Inbound:";
    data[Table10OrdersRow+5][0] = "Cyber Attack Outbound (cannot also select inbound):";
    for(i = 0; i < 5; i++) data[Table10OrdersRow+i+1][1] = "N";
    //Table 11: HARM Target list
    data[Table10HARMRow][0] = "Table 11: HARM Target List (0 for None. 1...5 for a hill ordered shortest to tallest, each target costs 2 points against your grade)";
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
function BatchGradeFiles(){ //only called once
    cleardatafeed();
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
    var feedback = ["","","","","","","","","",""]; //8 tables + 9th for exit message with harm missiles, and 10th for score
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
                    }
                    else{
                        feedback[6-1]+=feedbackmessage(6,r,c,correctvalue,studentvalue);
                    }
                }
            }
        }
    }
    for(i = 0; i < numcommlinks; i++){
        checked++;
        correctvalue = K3commlinks[i];
        studentvalue = A3commlinks[i];
        //console.log(checked,studentvalue,correctvalue);
        if(correctvalue == studentvalue){
            score += P3COMMLINKS;
        }
        else{
            feedback[3-1]+="("+(maplinktosam(i,false)+1).toString()+","+(maplinktosam(i,true)+1).toString()+") is incorrect. ";
        } 
    }
    for(r = 0; r < 2; r++){
        for(c = 0; c < 2; c++){
            if(HARMTargetList[r][c] >= 0){
                feedback[8] += POINTSHARM.toString() + " deducted for HARM shot. ";
                //penalize whether fired or not. :\
                score -= POINTSHARM;
            }
        }
    }
    feedback[9] = score.toString();
    var currentfilename = filestograde[whichfiletograde].name;
    console.log(currentfilename);
    console.log(feedback);
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

