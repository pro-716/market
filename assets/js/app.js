// shop app logic using Alpine.js
function shopApp(){
  return {
    products: [],
    filtered: [],
    query: '',
    cart: [],
    cartOpen: false,
    quickOpen: false,
    quick: {},
    cartCount: 0,
    total: 0,
    init(){
      // load products
      fetch('/data/products.json').then(r=>r.json()).then(data=>{
        this.products = data.products;
        this.filtered = this.products;
      });
      // load cart
      const saved = localStorage.getItem('cart_v1');
      if(saved){ this.cart = JSON.parse(saved); this.recalc(); }
    },
    search(){
      const q = this.query.trim().toLowerCase();
      if(!q){ this.filtered = this.products; return }
      this.filtered = this.products.filter(p=> p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    },
    formatPrice(v){ return new Intl.NumberFormat('ar-EG',{style:'currency',currency:'USD'}).format(v) },
    addToCart(p){
      const found = this.cart.find(i=>i.id===p.id);
      if(found){ found.qty +=1 } else { this.cart.push({...p, qty:1}) }
      this.saveCart();
      this.recalc();
      this.cartOpen = true;
    },
    saveCart(){ localStorage.setItem('cart_v1', JSON.stringify(this.cart)) },
    recalc(){ this.cartCount = this.cart.reduce((s,i)=>s+i.qty,0); this.total = this.cart.reduce((s,i)=>s + i.price*i.qty,0) },
    toggleCart(){ this.cartOpen = !this.cartOpen },
    toggleTheme(){ document.documentElement.classList.toggle('dark') },
    increase(id){ const it = this.cart.find(i=>i.id===id); if(it){ it.qty++; this.saveCart(); this.recalc() } },
    decrease(id){ const it = this.cart.find(i=>i.id===id); if(it){ it.qty--; if(it.qty<=0) this.cart = this.cart.filter(x=>x.id!==id); this.saveCart(); this.recalc() } },
    openQuick(p){ this.quick = p; this.quickOpen = true },
    checkout(){
      alert('شكراً — هذا عرض تجريبي للسلة. يمكنك الآن ربط باكند لحفظ الطلبات.');
      this.cart = []; this.saveCart(); this.recalc(); this.cartOpen=false;
    }
  }
}
