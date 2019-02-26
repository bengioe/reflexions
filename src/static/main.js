

function id(n){
    return document.getElementById(n);
}

function rq_item(item, callback){
    if (items.hasOwnProperty(item)){
        callback(items[item]);
    }else{
        fetch("items/"+item).then(r => r.json()).then(r => {items[r.name] = r; callback(r)});
    }
}


function load(){
    id('javascriptremoveme').innerHTML = '';
    id('homebutton').onclick = r => {changeto('index'); return false;};
    rq_item(new URL(window.location).searchParams.get('ii') || 'index', r => replace_front(r));
}

function changeto(item){
    rq_item(item, r => replace_front(r));
}

function fix_links(e){
    let els = e.querySelectorAll('a');
    for(let i=els.length; i--; ) {
        let url = new URL(els[i].href);
        if (url.search.startsWith('?ii=')){
            els[i].onclick = (r => {changeto(new URL(r.target.href).searchParams.get('ii')); return false;});
        }
    }
}

window.onpopstate = function(event) {
    replace_front(items[event.state], true);
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
        fix_links(div);
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,div]);
        itemstack.push(div);
        item._div = div;
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
    let heightLeft = vh - 10;
    for (let i=itemstack.length-1; i>=0; i--){
        let item = itemstack[i];
        item.targetTop = vh - heightLeft
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
