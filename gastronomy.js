(() => {
  const WA = '542234471818';
  const modal = document.getElementById('contactModal');
  const topic = document.getElementById('leadTopic');
  const openModal = (requestedTopic='') => {
    if (requestedTopic && topic) {
      const option = [...topic.options].find(o => o.value === requestedTopic);
      if (option) topic.value = option.value;
    }
    modal?.classList.add('open');
    modal?.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow='hidden';
  };
  const closeModal = () => {
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow='';
  };
  document.querySelectorAll('.js-open-contact').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    openModal(el.dataset.topic || '');
  }));
  document.querySelectorAll('.js-close-contact').forEach(el => el.addEventListener('click', closeModal));
  window.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });
  document.getElementById('contactForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('leadName').value.trim();
    const business = document.getElementById('leadBusiness').value.trim();
    const city = document.getElementById('leadCity').value.trim();
    const type = document.getElementById('leadType').value;
    const selectedTopic = document.getElementById('leadTopic').value;
    const problem = document.getElementById('leadProblem').value.trim();
    const msg = `Hola, soy ${name}. Quiero consultar por asesoramiento gastronómico.\n\nNegocio: ${business}\nCiudad: ${city || 'No indicada'}\nTipo de establecimiento: ${type}\nNecesito mejorar: ${selectedTopic}\n\nSituación / problema:\n${problem}\n\nMe gustaría coordinar un diagnóstico.`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

})();
