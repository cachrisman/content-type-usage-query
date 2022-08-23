(async () => {
  const contentful = require("contentful-management");
  const parallel = require("async-parallel");

  const client = contentful.createClient({
    accessToken: "<CMA_TOKEN>",
  });

  const space_id = "<SPACE_ID>";
  const environment_id = "<ENV_ID>";
  const space = await client.getSpace(space_id);
  const environment = await space.getEnvironment(environment_id);

  const getContentTypes = async () => {
    const content_types = await environment.getContentTypes({ limit: 1000 });
    return content_types.items;
  };

  const calculateUsage = async (content_type) => {
    try {
      const response = await environment.getEntries({
        limit: 1000,
        content_type: content_type.sys.id,
        order: "sys.createdAt",
      });

      const entries = response.items;
      let createdAt = null,
        updatedAt = null;

      if (!!entries.length) {
        createdAt = entries[0].sys.createdAt;
        updatedAt = entries.sort(
          (a, b) => new Date(a.sys.updatedAt) - new Date(a.sys.updatedAt)
        )[0].sys.updatedAt;
      }

      return {
        name: content_type.sys.id,
        quantity: response.total,
        most_recently_created: createdAt,
        most_recently_updated: updatedAt,
      };
    } catch (error) {
      console.log(error);
      return {};
    }
  };

  const content_types = await getContentTypes();
  parallel.setConcurrency(3);
  const usage = await parallel.map(content_types, calculateUsage);
  usage.sort(
    (a, b) =>
      new Date(b.most_recently_created) - new Date(a.most_recently_created)
  );
  console.log(
    "\n================================================= Usage =================================================\n"
  );
  console.table(usage);
})();
