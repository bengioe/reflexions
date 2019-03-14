

function id(n){
    return document.getElementById(n);
}

function rq_item(item, callback){
    if (items.hasOwnProperty(item)){
        callback(items[item]);
    }else{
        fetch("items/"+item, {cache: "no-cache"}).then(r => r.json()).then(r => {items[r.name] = r; callback(r)});
    }
}


function load(){
    id('javascriptremoveme').innerHTML = '';
    id('homebutton').onclick = r => {changeto('index'); return false;};
    id('aboutbutton').onclick = r => {changeto('about'); return false;};
    rq_item(new URL(window.location).searchParams.get('ii') || 'index', r => replace_front(r));
}

function changeto(item){
    rq_item(item, r => replace_front(r));
}

function fix_links(div, item){
    let els = div.querySelectorAll('a');
    for (let i=els.length; i--; ) {
        let url = new URL(els[i].href);
        if (url.search.startsWith('?ii=')){
            els[i].onclick = (r => {changeto(new URL(r.target.href).searchParams.get('ii')); return false;});
            els[i].style.textDecorationColor = '#5af';
        }
        if (url.search.startsWith('?as=')){
            let show = function(){
                console.log('aside:'+url.searchParams.get('as'), item['aside:'+url.searchParams.get('as')])
                item._sidediv.innerHTML = item['aside:'+url.searchParams.get('as')];
                item._sidediv.style.top = els[i].offsetTop+'px';
                item._sidediv.style.visibility = 'visible';
                MathJax.Hub.Queue(["Typeset",MathJax.Hub,item._sidediv]);
                //var delay=setTimeout(function(){showHideDivs(area.indx);},100);
                //area.onmouseout=function(){clearTimeout(delay);};
                return false;
            };
            els[i].onclick = show;
            els[i].onmouseover = show;
            els[i].style.textDecorationColor = '#fa1';
        }
    }
}



window.onpopstate = function(event) {
    rq_item(event.state, r => replace_front(r, true));
    //replace_front(items[event.state], true);
};

var itemdivs = [];
var itemstack = [];
var items = {}

function replace_front(item, preserveHistory){
    if (preserveHistory === undefined)
        window.history.pushState(item.name, "", "?ii="+item.name);
    if (items[item.name]._div === undefined){
        let div = document.createElement('div');
        div.classList.add('front_item');
        document.body.appendChild(div);
        div.style.top = "0px";
        div.style.left = window.innerWidth / 2 - div.offsetWidth / 2 + 'px';
        div.innerHTML = item.body;
        fix_links(div, item);
        itemstack.push(div);
        item._div = div;
        item._sidediv = document.createElement('div');
        item._sidediv.classList.add('front_item');
        item._sidediv.style.top = "0px";
        item._sidediv.style.left = (4 + div.offsetWidth) + "px";
        item._sidediv.style.visibility = 'hidden';
        div.appendChild(item._sidediv);
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,div]);
        //load_sidedivs(item);
    }
    else{
        itemstack.splice(itemstack.indexOf(items[item.name]._div), 1);
        itemstack.push(items[item.name]._div);
    }
    recompute_stack_positions();
    repaint();
    return false;
}

function recompute_stack_positions(){
    let vw = window.innerWidth, vh = window.innerHeight;
    let topMargin = 32;
    let heightLeft = vh - 10;
    for (let i=itemstack.length-1; i>=0; i--){
        let item = itemstack[i];
        item.targetTop = vh - heightLeft + topMargin;
        item.targetLeft = vw/2 - item.offsetWidth/2;
        item.departTop = item.offsetTop;
        item.departLeft = item.offsetLeft;
        item.departTime = new Date().getTime();
        item.targetTime = item.departTime + 500;
        item.moving = true;
        heightLeft -= item.offsetHeight + 5;
    }
}


function repaint(){
    // We only want to requestanimationframe if it has not been
    // requested yet:
    if (!repaint.has_repainted_this_frame){
        repaint.has_repainted_this_frame = true;
        requestAnimationFrame(repaint_);
    }
}


repaint.has_repainted_this_frame = false;
function repaint_(){
    repaint.has_repainted_this_frame = false;
    let somethingChanged = false;
    let now = new Date().getTime();

    function slerp(item){
        let _t = Math.min(1, (now - item.departTime) / (item.targetTime - item.departTime));
        let t = Math.sin(_t * Math.PI / 2);
        item.style.left = (item.currentLeft = item.departLeft + t * (item.targetLeft - item.departLeft)) + 'px';
        item.style.top = (item.currentTop = item.departTop + t * (item.targetTop - item.departTop)) + 'px';
        return (item.moving = _t < 1);
    }
    
    for (let i=0;i<itemstack.length; i++){
        let item = itemstack[i];
        if (item.moving){
            somethingChanged = slerp(item) || somethingChanged;
        }
    }
    
    if (somethingChanged){
        repaint();
    }
}
