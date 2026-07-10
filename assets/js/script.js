
document.querySelectorAll("[data-menu]").forEach((button)=>{
  button.addEventListener("click",()=>{
    button.closest(".nav").classList.toggle("open");
  });
});
document.querySelectorAll('a[href^="#"]').forEach((link)=>{
  link.addEventListener("click",(event)=>{
    const id=link.getAttribute("href");
    const target=document.querySelector(id);
    if(target){event.preventDefault();target.scrollIntoView({behavior:"smooth"});}
  });
});
