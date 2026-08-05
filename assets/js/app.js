// shop app logic using Alpine.js with 3D enhancements
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
    hero3d: null,
    viewer: null,
    init(){
      // load products
      fetch('/data/products.json').then(r=>r.json()).then(data=>{
        this.products = data.products;
        this.filtered = this.products;
        // init tilt after products render
        setTimeout(()=>{ this.initTilt() }, 300);
      });
      // load cart
      const saved = localStorage.getItem('cart_v1');
      if(saved){ this.cart = JSON.parse(saved); this.recalc(); }

      // init 3D background
      this.initHero3D();

      // resize handling
      window.addEventListener('resize', ()=>{ this.onResize() });
    },
    initTilt(){
      // apply VanillaTilt to all elements with data-tilt
      const nodes = document.querySelectorAll('[data-tilt]');
      if(nodes.length && window.VanillaTilt){
        VanillaTilt.init(nodes, {max:18, speed:400, glare:true, "max-glare":0.22, scale:1.02});
      }
    },
    initHero3D(){
      // lightweight three.js scene with moving particles
      const canvas = document.getElementById('hero-3d');
      const rect = canvas.getBoundingClientRect();
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, Math.max(1, window.innerWidth/window.innerHeight), 0.1, 1000);
      camera.position.z = 40;
      const renderer = new THREE.WebGLRenderer({canvas: canvas, alpha:true, antialias:true});
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      // particles
      const group = new THREE.Group();
      const geo = new THREE.SphereGeometry(0.6, 12, 12);
      const mat = new THREE.MeshStandardMaterial({color:0x7CFFFA, emissive:0x7CFFFA, emissiveIntensity:0.3});
      for(let i=0;i<30;i++){
        const m = new THREE.Mesh(geo, mat);
        m.position.x = (Math.random()-0.5)*80;
        m.position.y = (Math.random()-0.5)*40;
        m.position.z = (Math.random()-0.5)*60;
        group.add(m);
      }
      scene.add(group);

      // lights
      const amb = new THREE.AmbientLight(0xffffff, 0.25);
      scene.add(amb);
      const pLight = new THREE.PointLight(0x7F00FF, 1.2);
      pLight.position.set(50,50,50);
      scene.add(pLight);

      let t = 0;
      function animate(){
        t += 0.01;
        group.rotation.y = t*0.2;
        group.children.forEach((c, i)=>{
          c.position.y += Math.sin(t + i)*0.01;
        });
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }
      animate();

      // mouse parallax
      window.addEventListener('mousemove', (e)=>{
        const nx = (e.clientX/window.innerWidth - 0.5)*2;
        group.rotation.x = nx*0.08;
        group.rotation.y = nx*0.12;
      });

      // store to adjust on resize
      this.hero3d = {renderer, camera};
    },
    onResize(){
      if(this.hero3d){
        this.hero3d.renderer.setSize(window.innerWidth, window.innerHeight);
        this.hero3d.camera.aspect = Math.max(1, window.innerWidth/window.innerHeight);
        this.hero3d.camera.updateProjectionMatrix();
      }
    },
    search(){
      const q = this.query.trim().toLowerCase();
      if(!q){ this.filtered = this.products; return }
      this.filtered = this.products.filter(p=> p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      // re-init tilt for new nodes
      setTimeout(()=>{ this.initTilt() }, 100);
    },
    formatPrice(v){
      // display in Iraqi Dinar (IQD)
      try{
        return new Intl.NumberFormat('ar-IQ', { style:'currency', currency:'IQD', maximumFractionDigits:0 }).format(Math.round(v));
      }catch(e){
        return v + ' IQD';
      }
    },
    addToCart(p, evt){
      // 3D fly to cart animation (clone image and animate to cart icon)
      this.animateFlyToCart(evt?.target || null, p.image);

      const found = this.cart.find(i=>i.id===p.id);
      if(found){ found.qty +=1 } else { this.cart.push({...p, qty:1}) }
      this.saveCart();
      this.recalc();
      this.cartOpen = true;
    },
    animateFlyToCart(triggerEl, imageUrl){
      try{
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.position = 'fixed';
        img.style.width = '120px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '12px';
        img.style.zIndex = 9999;
        document.body.appendChild(img);

        const startRect = (triggerEl && triggerEl.getBoundingClientRect()) || {left: window.innerWidth/2, top: window.innerHeight/2};
        img.style.left = (startRect.left) + 'px';
        img.style.top = (startRect.top) + 'px';

        const cartBtn = document.querySelector('header button[ @click]') || document.querySelector('header button');
        const cartRect = document.querySelector('header button[ @click]')?.getBoundingClientRect() || document.querySelector('header button')?.getBoundingClientRect() || {left:20, top:20};

        gsap.to(img, {duration:0.9, x: (cartRect.left - startRect.left), y: (cartRect.top - startRect.top), scale:0.2, rotation:360, ease:'power2.inOut', onComplete: ()=>{ img.remove(); }});
      }catch(e){ console.warn('animation fail', e); }
    },
    saveCart(){ localStorage.setItem('cart_v1', JSON.stringify(this.cart)) },
    recalc(){ this.cartCount = this.cart.reduce((s,i)=>s+i.qty,0); this.total = this.cart.reduce((s,i)=>s + i.price*i.qty,0) },
    toggleCart(){ this.cartOpen = !this.cartOpen },
    toggleTheme(){ document.documentElement.classList.toggle('dark') },
    increase(id){ const it = this.cart.find(i=>i.id===id); if(it){ it.qty++; this.saveCart(); this.recalc() } },
    decrease(id){ const it = this.cart.find(i=>i.id===id); if(it){ it.qty--; if(it.qty<=0) this.cart = this.cart.filter(x=>x.id!==id); this.saveCart(); this.recalc() } },
    openQuick(p){ this.quick = p; this.quickOpen = true; setTimeout(()=>{ this.initViewer(p.image) }, 80); },
    initViewer(imageUrl){
      // simple three.js textured box viewer
      try{
        const canvas = document.getElementById('product-viewer');
        while(canvas && canvas._three) { /* dispose previous */ if(canvas._three.renderer) { canvas._three.renderer.dispose(); } break; }
        const renderer = new THREE.WebGLRenderer({canvas: canvas, alpha:true, antialias:true});
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(200,200);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45,1,0.1,1000);
        camera.position.z = 3;
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5,5,5);
        scene.add(light);
        const geo = new THREE.BoxGeometry(1.2,1.2,1.2);
        const tex = new THREE.TextureLoader().load(imageUrl);
        const mat = new THREE.MeshStandardMaterial({map:tex});
        const mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        let rot = 0;
        function render(){ rot += 0.01; mesh.rotation.y = rot; renderer.render(scene, camera); requestAnimationFrame(render); }
        render();
        canvas._three = {renderer, scene, camera};
      }catch(e){ console.warn('viewer init error', e); }
    },
    checkout(){
      alert('شكراً — هذا عرض تجريبي للسلة. يمكنك الآن ربط باكند لحفظ الطلبات.');
      this.cart = []; this.saveCart(); this.recalc(); this.cartOpen=false;
    }
  }
}
