var d64=(function(){
// C = chat, S = socket, cI = chat input, tN = temp nick
var C,S,o,hidden,visibilityChange,cI,tN,btcChat=true;
function wss(){
	try{
		S=new WebSocket("wss://d64.nl/live");
		S.onopen=()=>{
			sC("life","green");
			if(window.location.pathname==='/'){
//				if(o===undefined)
					S.send(JSON.stringify({mod:"chat",rq:"init"}));
			}
			if(cI!==null)
				iC();
		};
		S.onerror=e=>{
		};
		S.onmessage=m=>{
			sC("life","#ff0");
			v(m.data);
			l(m.data)
		};
		S.onclose=()=>{
			sC("life","red");
			chatConnStatus();
			if(!document[hidden])
				setTimeout(wss,1000);
		};
	}catch(e){
		l(e)
	}
}
// console
function l(m){
	console.log(m)
}
// send
function s(m){
	sC("life","blue");
	S.send(m)
}
function chatParser(){
	if(o.chat!==undefined){
		if(C===undefined||o.chat.length>1){
			C=o;
			printChat();
		}else chatStack(o.chat[0]);

		if(o.nicks!==undefined)
			onlineNicks(o.nicks);
	}else if(o.qjb!==undefined&&o.qjb===tN){
		SC("chat",tN,100);
		cI.value="";
		cI.setAttribute("maxlength",128);
		cI.placeholder="Hoi "+gC("chat")+", type hier je bericht";
	}else if(o.err!==undefined&&o.err==="dup_nick"){
		cI.value="";
		cI.placeholder="Deze nicknaam bestaat al, kies een andere..";
		document.cookie = "chat=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
	}
}
function onlineNicks(n){
	var output="";
	for(i in n)
		output+="<span>"+n[i]["n"]+"</span>, ";
	document.getElementById("cN").innerHTML="Online chatters: "+output.substring(0,output.length-2);
}
function chatStack(m){
	if(C.chat.length===30)
		C.chat.shift();
	C.chat.push(m);
	printChat();
}
function printChat(){
	var i,x='';
	for(i in C.chat)
		x+="<div>"+C.chat[i]["n"]+": "+C.chat[i]["m"]+"</div>";
	document.getElementById("cB").innerHTML=x;
	scrollDown();
}
// Validate
function v(d){
	try{
		o=JSON.parse(d);
		if(o.mod!==undefined&&o.mod==="btc"&&btcChat===true)
			chatStack({"n":"btc-bot","m":"&euro; "+o.btc_euro});
		else if(o.mod!==undefined&&o.mod==="chat")
			chatParser();
		sC("life","green");
	}catch(e){
		l(e);
	}
}
function scrollDown(){
	content=document.getElementById("content");
	window.scrollTo(0,content.scrollHeight);
}
// set color
function sC(i,c){
	document.getElementById(i).style.color=c
}
// visibility
if(typeof document.hidden!=="undefined"){
	hidden="hidden";
	visibilityChange="visibilitychange"
}else if(typeof document.msHidden!=="undefined"){
	hidden="msHidden";
	visibilityChange="msvisibilitychange"
}else if(typeof document.webkitHidden!=="undefined"){
	hidden="webkitHidden";
	visibilityChange="webkitvisibilitychange"
}
function handleVisibilityChange(){
	if(document[hidden]){
		S.onclose=()=>{};
		S.close()
	}else wss()
}
if(typeof document.addEventListener!=="undefined"||hidden===undefined)
	document.addEventListener(visibilityChange,handleVisibilityChange,false);
// setCookie
function SC(cn,cv,exd){
	var d=new Date(),exp;
	d.setTime(d.getTime()+(exd*24*60*60*1000));
	exp="expires="+d.toUTCString();
	document.cookie=cn+"="+cv+";"+exp+";path=/;secure";
}
// getCookie
function gC(cname){
	var name=cname+"=",decodedCookie=decodeURIComponent(document.cookie),ca=decodedCookie.split(";"),i;
	for(i=0;i<ca.length;i++){
		var c=ca[i];
		while(c.charAt(0)==" ")
			c=c.substring(1);
		if(c.indexOf(name)==0)
			return c.substring(name.length,c.length);
	}
	return "";
}
// Init chat
function iC(){
	if(gC("chat")==="")
		cI.placeholder="Type eerst je nicknaam.."
	else if(!checkNick(gC("chat"))){
		cI.placeholder="Geen geldige nicknaam"
	}else if(gC("chat").length<3){
		//
	}else if(gC("chat").length>9){
		//
	}else{
		cI.setAttribute("maxlength",128);
		cI.placeholder="Hoi "+gC("chat")+", type hier je bericht"
	}
}
// check nick
function checkNick(n){
	if(n.match(/^([A-z0-9_-]{1,9})$/g)===null)
		return false;
	else return true
}
// connection status
function chatConnStatus(){
	if(cI!==null){
		if(S.readyState===S.CLOSED)
			cI.placeholder="Verbinding verbroken :( ik probeer opnieuw..";
		else if(S.readyState===S.OPEN)
			iC();
	}
}
document.addEventListener("DOMContentLoaded",function(){
//	scrollDown();
	window.addEventListener("resize",scrollDown);
	document.getElementById("btc").addEventListener("change",()=>{
		if(this.checked)
			btcChat=true;
		else btcChat=false;
	});
	cI=document.getElementById("cI");
	if(cI!==null){
		// init
		iC();
		/*
		* Wait for the ENTER (13) key
		*/
		cI.addEventListener("keyup",function(e){
			if(e.keyCode===13&&cI.value!==""){
				// Set the nickname
				if(gC("chat")===""){
					// Remove line breaks
					cI.value=cI.value.replace(/(\r\n|\n|\r)/gm,"");
					if(!checkNick(cI.value)){
						cI.value="";
						cI.placeholder="Nicknaam mag alleen letters en cijfers bevatten"
					}else if(cI.value.length<3){
						cI.value="";
						cI.placeholder="Nicknaam moet minimaal 3 karakters zijn"
					}else if(cI.value.length>9){
						cI.value="";
						cI.placeholder="Nicknaam mag maximaal 9 karakters zijn"
					}else{
						// request nick
						tN=cI.value;
						S.send(JSON.stringify({mod:"chat",rq:"nick",nick:tN}));
						cI.value="";
						cI.placeholder="Nicknaam controleren..";
					}
				}else if(checkNick(gC("chat"))&&gC("chat").length>=3&&cI.value.trim().length>0){
					S.send(JSON.stringify({mod:"chat",cB:{n:gC("chat"),m:cI.value.replace(/(\r\n|\n|\r)/gm,"")}}));
					cI.value=""
				}
			}
		})
	}
//	document.getElementById("ytvi").addEventListener("click",function(){
//		document.getElementById("ytvi").remove();
//		document.getElementById("ytp").classList.add("yt");
//		document.getElementById("ytp").innerHTML='<iframe class="ytv" src="https://www.youtube-nocookie.com/embed/VeVjEg4znQk" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
//	});
	if('serviceWorker' in navigator){
		navigator.serviceWorker.register('/service-worker.js',{scope:'/'})
		.then((r)=>{
			// registration worked
			console.log('Registration succeeded. Scope is '+r.scope);
		}).catch((e)=>{
			// registration failed
			console.log('Registration failed with '+e);
		});
	}
	wss();
},false);
}());
