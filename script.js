const PRODUCTS=[
{id:1,n:"SATYX Core Tee",p:799,o:999,c:"dark",tag:"BESTSELLER",cat:["tee","oversized","drop"],d:"The essential SATYX piece. A clean oversized silhouette built around the core identity of the brand."},
{id:2,n:"Identity Oversized Tee",p:899,o:1199,c:"",tag:"NEW",cat:["tee","oversized","drop"],d:"A statement graphic piece designed for everyday wear."},
{id:3,n:"No Limits Tee",p:849,o:1099,c:"lime",tag:"LIMITED",cat:["tee","drop"],d:"Bold energy from Drop 001. Designed to stand out."},
{id:4,n:"After Dark Tee",p:899,o:1199,c:"blue",tag:"NEW",cat:["tee","oversized"],d:"Dark tones, clean attitude and a relaxed silhouette."}
  {
    id: 5,
    n: "ARC Core Oversized Tee",
    p: 899,
    o: 1199,
    c: "arc-core",
    tag: "DROP 001",
    cat: ["tee", "oversized", "drop"],
    d: "Power Within. An oversized statement tee featuring the Arc Core graphic."
},

{
    id: 6,
    n: "Multiverse Oversized Tee",
    p: 899,
    o: 1199,
    c: "multiverse",
    tag: "DROP 001",
    cat: ["tee", "oversized", "drop"],
    d: "Different realities. Same purpose. A cosmic SATYX statement piece."
},

{
    id: 7,
    n: "Hero Code Oversized Tee",
    p: 899,
    o: 1199,
    c: "hero-code",
    tag: "DROP 001",
    cat: ["tee", "oversized", "drop"],
    d: "Code. Discipline. Focus. Purpose. The Hero Code from SATYX Drop 001."
}
];
let cart=JSON.parse(localStorage.satyxCart||"[]"),user=JSON.parse(localStorage.satyxUser||"null");
const $=x=>document.querySelector(x), money=x=>"₹"+x.toLocaleString("en-IN");
function image(p){let t=p.id==1?"SATYX":p.id==2?"IDENTITY":p.id==3?"NO LIMITS":"AFTER DARK";return `<div class="pic ${p.c}"><div class="shirt">${t}</div><span class="badge">${p.tag}</span></div>`}
function card(p){return `<a class="card" href="product.html?id=${p.id}">${image(p)}<div class="info"><div class="name">${p.n}</div><div class="price">${money(p.p)} <span class="old">${money(p.o)}</span><span class="off">${Math.round((1-p.p/p.o)*100)}% OFF</span></div><div class="meta">Drop 001 · ${p.cat.includes("oversized")?"Oversized Fit":"Everyday Fit"}</div></div></a>`}
function save(){localStorage.satyxCart=JSON.stringify(cart);document.querySelectorAll("#count").forEach(x=>x.textContent=cart.reduce((a,b)=>a+b.q,0))}
function toast(s){let t=$("#toast");if(!t)return;t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
function renderGrid(target="grid",cat="all"){let a=cat==="all"?PRODUCTS:PRODUCTS.filter(x=>x.cat.includes(cat));let el=$("#"+target);if(el)el.innerHTML=a.map(card).join("")}
function setFilter(cat,b){document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderGrid("grid",cat)}
function productById(){let id=Number(new URLSearchParams(location.search).get("id"));return PRODUCTS.find(x=>x.id===id)||PRODUCTS[0]}
function addProduct(id,size="M",qty=1){let x=cart.find(a=>a.id===id&&a.s===size);x?x.q+=qty:cart.push({id,s:size,q:qty});save();toast("Added to cart")}
function renderCart(){let el=$("#cartItems"),total=$("#total");if(!el)return;if(!cart.length){el.innerHTML='<div class="empty">Your cart is empty.<br><br><a class="btn black" href="shop.html">SHOP NOW</a></div>';if(total)total.textContent="₹0";return}el.innerHTML=cart.map((x,i)=>{let p=PRODUCTS.find(a=>a.id===x.id);return `<div class="cartItem"><div class="mini">${p.n}</div><div><b>${p.n}</b><p style="font-size:10px;color:#777">Size ${x.s} · Qty ${x.q}</p><b>${money(p.p*x.q)}</b><br><button onclick="removeCart(${i})" style="border:0;background:none;text-decoration:underline;font-size:9px;padding:7px 0">REMOVE</button></div></div>`}).join("");total.textContent=money(cart.reduce((a,x)=>a+PRODUCTS.find(p=>p.id===x.id).p*x.q,0))}
function removeCart(i){cart.splice(i,1);save();renderCart()}
function accountPage(){let el=$("#account");if(!el)return;if(user)el.innerHTML=`<div class="account"><div class="eyebrow">SATYX ACCOUNT</div><h1>WELCOME BACK.</h1><p>${user.name}<br>${user.email}<br>${user.phone||""}</p><button class="btn black" onclick="logout()">LOG OUT</button></div>`;else el.innerHTML=`<div class="account"><div class="eyebrow">SATYX ACCOUNT</div><h1>JOIN THE COMMUNITY.</h1><div class="field"><label>FULL NAME</label><input id="name"></div><div class="field"><label>EMAIL</label><input id="email" type="email"></div><div class="field"><label>PHONE</label><input id="phone"></div><div class="field"><label>PASSWORD</label><input type="password"></div><button class="btn black" onclick="signup()">CREATE ACCOUNT</button><p style="font-size:10px;color:#777">Demo authentication. Add secure backend authentication before launch.</p></div>`}
function signup(){let n=$("#name").value,e=$("#email").value,p=$("#phone").value;if(!n||!e)return toast("Enter name and email");user={name:n,email:e,phone:p};localStorage.satyxUser=JSON.stringify(user);location.reload()}
function logout(){localStorage.removeItem("satyxUser");location.reload()}
function checkout(){if(!cart.length)return toast("Cart is empty");location.href="checkout.html"}
function initHeader(){save()}
document.addEventListener("DOMContentLoaded",initHeader);

function placeOrder(){let n=$("#cn").value,e=$("#ce").value,p=$("#cp").value,a=$("#ca").value;if(!n||!e||!p||!a)return toast("Complete all details");let id="SAT-"+Date.now().toString().slice(-7);document.querySelector("main").innerHTML=`<div style="text-align:center;padding:80px 0"><div style="font-size:60px">✓</div><div class="eyebrow">ORDER CREATED</div><h1 style="font-size:55px;letter-spacing:-4px">THANK YOU, ${n.split(" ")[0].toUpperCase()}.</h1><p>Order #${id} has been created.</p><a class="btn black" href="shop.html">CONTINUE SHOPPING</a></div>`;cart=[];save()}
