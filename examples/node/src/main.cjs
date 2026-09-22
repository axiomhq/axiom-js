const { AxiomClient } = require('@axiomhq/js');

const main = async () => {
  const axiom = new AxiomClient({});

  await axiom.ingest(process.env.AXIOM_DATASET, [{ foo: 'bar' }]);
};

main();
