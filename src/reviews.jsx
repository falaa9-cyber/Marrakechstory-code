/* ============================================================================
   MS_ReviewsGallery — real Google reviews + traveller photo gallery.
   Sits below the contact section. Images hosted locally (assets/reviews/).
   ========================================================================== */
(function () {
  const { useState, useRef } = React;

  // Real Google reviews (MarrakechStory Tours · 5.0 · 28 reviews)
  const REVIEWS = [
    { name: 'Rugile Ad', text: "I recently traveled to Marrakesh with Marrakesh Story, and I couldn't be more pleased with the entire experience! My boyfriend and I were absolutely delighted with how the trip was tailored specifically for us." },
    { name: 'Younes el khomri', text: "My wife and I had the absolute best holiday of our lives thanks to Marrakesh Story! From start to finish, everything was perfectly planned, allowing us to fully enjoy every moment without a single worry." },
    { name: 'Dee Pinkney', text: "Very easy to communicate with! We decided which activities we wanted to do and the dates we would be in Morocco, sent them a message and they took it from there. Very easy!" },
    { name: 'Alexander Ganapathy', text: "We had an amazing day trip to the Agafay Desert with MarrakechStory. They let us visit several camps before we chose the one we liked best. The service was top-notch from start to finish. Highly recommended!" },
    { name: 'Adrienne Galloway', text: "My family and I used Yaya as a taxi driver a few times throughout our stay. He was welcoming, punctual and had a clean vehicle. He communicated clearly. Would recommend Yaya to anyone visiting Morocco." },
    { name: 'BABS Jonquille', text: "What a fantastic 5-day trip we had in Marrakech. We couldn't have done any of this without the tremendous effort of Aladdin and his team at Marrakech Story Tours. What a blast!" },
    { name: 'Arnfinn Jr. Lauvas', text: "We traveled two adults and two children to Marrakech in April 2024. Aladdin and Marte at Marrakech Story organized EVERYTHING for us, assisting with booking and transportation." },
    { name: 'Alexia Terrones', text: "A wonderful experience for our first trip to Morocco. Aladin was always attentive and available throughout the day. He handled everything very professionally. I will definitely use this agency again." },
    { name: 'Juteau andrea', text: "Fantastic premium experience! My parents and I went on a quad bike excursion in the Agafay Desert at sunset, it was absolutely amazing. The team is professional and the service is 5-star!" },
    { name: 'Leo JIMENEZ', text: "We were lucky enough to have Yaya as our driver in Marrakech, and we highly recommend him. Very punctual, discreet, and always accommodating. He knows the city perfectly." },
    { name: 'Unn West', text: "We booked dinner with a show and camel ride with Marrakech Story Tours. A truly magical experience with fantastic food, friendly camel drivers and a beautiful sunset from the back of a camel. Highly recommended." },
    { name: 'Chaimz B', text: "Went with 10 girls on a trip to Marrakesh and got super nice help to have an unforgettable day in the Agafay desert. They arranged everything for us so we could just enjoy and have fun. Recommended!" },
    { name: 'Radoan Kibbo', text: "Super service from start to finish. They helped us find the most exotic Riad in the old town. We would recommend anyone who wants to explore Marrakech to contact Aladdin." },
    { name: 'yousra boudraa', text: "We had a wonderful stay thanks to Aladin, who was very responsive and helpful. We were a group of 11 people, including a child and a baby." },
  ];

  const IMAGES = Array.from({ length: 16 }, (_, i) => 'assets/reviews/tour-' + String(i + 1).padStart(2, '0') + '.jpg');

  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const Stars = () => (
    <span className="ms-rev-stars" aria-label="5 stars">{'★★★★★'}</span>
  );

  function MS_ReviewsGallery() {
    const ctx = (window.MS_CTX && window.MS_CTX.useMS && window.MS_CTX.useMS()) || {};
    const lang = ctx.lang || 'en';
    const tx = (en, no, fr, de) => lang === 'no' ? no : lang === 'da' ? no : lang === 'fr' ? fr : lang === 'de' ? (de || en) : en;
    const [showAll, setShowAll] = useState(false);
    const galRef = useRef(null);
    const visible = showAll ? IMAGES : IMAGES.slice(0, 4);

    return (
      <section className="ms-rev-section" id="reviews">
        {/* Reviews */}
        <div className="ms-rev-inner">
          <h2 className="ms-rev-h">{tx('What Our Travellers Say', 'Hva våre reisende sier', 'Ce que disent nos voyageurs', 'Was unsere Reisenden sagen')}</h2>
          <div className="ms-rev-sub">
            <span className="ms-rev-stars">★</span> 5.0 · 28 {tx('Google reviews', 'Google-anmeldelser', 'avis Google', 'Google-Bewertungen')} · MarrakechStory Tours
          </div>
          <div className="ms-rev-grid">
            {REVIEWS.map((r, i) => (
              <article className="ms-rev-card" key={i}>
                <div className="ms-rev-top">
                  <div className="ms-rev-ava" aria-hidden="true">{initials(r.name)}</div>
                  <div className="ms-rev-meta">
                    <div className="ms-rev-name">{r.name}</div>
                    <Stars />
                  </div>
                </div>
                <p className="ms-rev-text">{r.text}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <div className="ms-gal-inner" ref={galRef}>
          <h2 className="ms-rev-h">{tx('Moments From Our Tours', 'Øyeblikk fra våre turer', 'Instants de nos circuits', 'Momente von unseren Touren')}</h2>
          <div className="ms-rev-sub ms-gal-sub">{tx('Real photos from our travellers across Marrakech & beyond', 'Ekte bilder fra våre reisende i Marrakech og videre', 'De vraies photos de nos voyageurs à Marrakech et au-delà', 'Echte Fotos unserer Reisenden in Marrakesch und darüber hinaus')}</div>
          <div className="ms-gal-grid">
            {visible.map((src, i) => (
              <a className="ms-gal-item" key={i} href={src} target="_blank" rel="noopener" aria-label={'Tour photo ' + (i + 1)}>
                <img src={src} loading="lazy" decoding="async" alt={'MarrakechStory tour photo ' + (i + 1)} />
              </a>
            ))}
          </div>
          <div className="ms-gal-more-row">
            <button className="ms-gal-more" type="button" onClick={() => {
              if (showAll) { setShowAll(false); setTimeout(() => { galRef.current && galRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); }
              else setShowAll(true);
            }}>
              {showAll ? tx('Show less', 'Vis mindre', 'Voir moins', 'Weniger anzeigen') : tx('Show more', 'Vis mer', 'Voir plus', 'Mehr anzeigen')}
            </button>
          </div>
        </div>
      </section>
    );
  }

  window.MS_ReviewsGallery = MS_ReviewsGallery;
})();
