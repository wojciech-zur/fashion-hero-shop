const props = [
  {
    label: "DISCOVERY",
    title: "Thousands Of Sellers, One Search",
    description:
      "From top brands to independent designers - find exactly what you're looking for across thousands of curated sellers.",
  },
  {
    label: "TRUST",
    title: "Verified Sellers, Real Reviews",
    description:
      "Every seller on FashionHero is vetted. Real customer reviews and our Pro seller program help you shop with confidence.",
  },
  {
    label: "VARIETY",
    title: "From Streetwear To Sustainable",
    description:
      "Premium brands, vintage finds, handmade originals, everyday basics. Whatever your style, it's here.",
  },
];

export function ValueProps() {
  return (
    <section className="px-4 md:px-8 lg:px-12 py-16 bg-cream-light">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto text-center">
        {props.map((prop) => (
          <div key={prop.label}>
            <p className="text-[11px] font-medium uppercase tracking-[0.8px] text-warm-gray mb-2">
              {prop.label}
            </p>
            <h3 className="text-lg font-normal text-charcoal mb-3">{prop.title}</h3>
            <p className="text-sm text-warm-gray leading-relaxed">{prop.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
