import * as THREE from "three";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";
import gsap from "gsap";

const contentArray = [
  {
    title: "BEHOLD!!",
    subtitle: "a new experience created with...",
    color: [0.1, 0.8, 0.1],
  },
  {
    title: "RAYMARCHING",
    subtitle: "with more interactions by...",
    color: [0.65, 0.2, 0.1],
  },
  {
    title: "KHANJAN JHA",
    subtitle: "...MOODY DEV...",
    color: [1, 0.9, 0.1],
  },
];

export default class Sketch {
  constructor() {
    this.currentContentIndex = 0;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xeeeeee, 1);

    this.container = document.getElementById("container");
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.container.appendChild(this.renderer.domElement);

    // Add mouse hold detection
    let pressTimer;
    const contentElement = document.querySelector(".content");

    contentElement.addEventListener("mousedown", () => {
      pressTimer = setTimeout(() => {
        this.currentContentIndex =
          (this.currentContentIndex + 1) % contentArray.length;
        this.updateContent();
      }, 1000);
    });

    contentElement.addEventListener("mouseup", () => {
      clearTimeout(pressTimer);
    });

    contentElement.addEventListener("mouseleave", () => {
      clearTimeout(pressTimer);
    });

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 2);
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.paused = false;

    this.setupResize();

    this.addObjects();
    this.resize();
    this.render();
    this.mouseEvents();
    this.initAnimations();
    // this.settings();

    // Update content initially (after material is created)
    this.updateContent();
  }

  initAnimations() {
    gsap.set("h1", { opacity: 0, y: 10 });
    gsap.set("p", { opacity: 0, y: 50 });
  }

  mouseEvents() {
    this.mouse = new THREE.Vector2();
    let that = this;
    function onMouseMove(event) {
      that.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      that.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      that.material.uniforms.mouse.value = that.mouse;
    }
    window.addEventListener("mousemove", onMouseMove.bind(this));
  }
  settings() {
    this.settings = {
      time: 0,
    };
    this.gui.add(this.settings, "time", 0, 100, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    // image cover
    this.imageAspect = 1;
    let a1;
    let a2;
    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    // optional - cover with quad
    const dist = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2 * (180 / Math.PI) * Math.atan(height / (2 * dist));

    // if(w/h>1) {
    if (this.width / this.height > 1) {
      this.plane.scale.x = this.camera.aspect;
      // this.plane.scale.y = this.camera.aspect;
    } else {
      this.plane.scale.y = 1 / this.camera.aspect;
    }

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },
        mouse: { type: "v2", value: new THREE.Vector2(0, 0) },
        resolution: { type: "v4", value: new THREE.Vector4() },
        rotationSpeed: { type: "f", value: 0.9 }, // 0.1 is equivalent to time/10
        scaleIntensity: { type: "f", value: 13.0 },
        sphereSize: { type: "f", value: 0.4 },
        sphereColor: {
          type: "v3",
          value: new THREE.Vector3(...contentArray[0].color),
        },
        uvRate1: {
          value: new THREE.Vector2(1, 1),
        },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  }

  stop() {
    this.paused = true;
  }

  play() {
    this.paused = false;
    this.render();
  }

  render() {
    if (this.paused) return;
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;

    // Auto rotate when not animating
    if (this.material.uniforms.rotationSpeed.value >= 0.9) {
      this.material.uniforms.rotationSpeed.value =
        0.9 + Math.sin(this.time * 0.5) * 0.1;
    }

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
  }

  updateContent() {
    const currentContent = contentArray[this.currentContentIndex];
    const h1 = document.querySelector(".content h1");
    const p = document.querySelector(".content p");

    // Start rotation speed-up immediately
    gsap.to(this.material.uniforms.rotationSpeed, {
      value: 0.0,
      duration: 0.8,
      ease: "easeInOutCirc",
      onComplete: () => {
        gsap.to(this.material.uniforms.rotationSpeed, {
          value: 1,
          duration: 1,
          ease: "easeInOutCirc",
        });
      },
    });

    gsap.set(this.material.uniforms.scaleIntensity, { value: 33.0 });
    gsap
      .timeline()
      .to(this.material.uniforms.scaleIntensity, {
        value: 12.0,
        duration: 1.2,
        ease: "easeInOutCirc",
      })
      .to(this.material.uniforms.scaleIntensity, {
        value: 30.0,
        duration: 1.2,
        ease: "easeInOutCirc",
      });

    gsap.set(this.material.uniforms.sphereSize, { value: 0.4 });
    gsap
      .timeline()
      .to(this.material.uniforms.sphereSize, {
        value: 0.5,
        duration: 1.2,
        ease: "easeInOutCirc",
      })
      .to(this.material.uniforms.sphereSize, {
        value: 0.4,
        duration: 1.2,
        ease: "easeInOutCirc",
      });

    // Start color change immediately (in parallel)
    gsap.to(this.material.uniforms.sphereColor.value, {
      x: currentContent.color[0],
      y: currentContent.color[1],
      z: currentContent.color[2],
      duration: 1,
      ease: "easeInOutCirc",
    });

    // Update text
    h1.textContent = currentContent.title;
    p.textContent = currentContent.subtitle;

    // Animate text position
    gsap.set([h1, p], { y: 100, opacity: 0 });
    gsap.to([h1, p], {
      y: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.32,
      ease: "easeInOutCirc",
    });

    // gsap.from( p, {
    //   y: 50,
    //   ease: "easeInOutCirc",
    //   duration: 1,
    // })

    // gsap.from( h1, {
    //   x: -100,
    //   ease: "easeInOutCirc",
    //   duration: 1,

    // })
  }
}

new Sketch("container");
