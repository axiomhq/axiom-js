const { Axiom } = require('@axiomhq/js');

const main = async () => {
  const axiom = new Axiom({});

  await axiom.ingest(process.env.AXIOM_DATASET, [{ foo: 'bar' }]);
};

main();
