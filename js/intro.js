(function() {
    $(window).on('load', function() {
      var background, intro, loader, logo, tl;
      intro = $('.intro');
      loader = $('.load');
      background = $('.background');
      logo = $('.logo > img');
      tl = new TimelineMax();
      return tl.fromTo(logo, 0, {
        scale: .95,
        alpha: 0
      }, {
        ease: Expo.easeOut,
        scale: 1,
        alpha: 1,
        delay: 0
      }).to(loader, 0.3, {
        ease: Power4.easeInOut,
        x: "0%",
        onComplete: function() {
          return TweenMax.set(logo, {
            visibility: "hidden",
            delay: 0
          });
        }
      }).to(loader, 0, {
        ease: Power4.easeInOut,
        x: "100%"
      }).to(background, 0, {
        ease: Power4.easeInOut,
        x: "100%",
        onComplete: function() {
          return TweenMax.set(intro, {
            visibility: "hidden"
          });
        }
      });
    });
  
  }).call(this);
  