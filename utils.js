const core = require("@actions/core");

/**
 * Parse input from env.
 * @returns Config
 */
let getConfig = function () {
  const config = {
    owner: core.getInput("owner", { required: true }),
    name: core.getInput("name", { required: true }),
    token: core.getInput("token", { required: true }),
  };

  return config;
};

let findPackageVersionByTag = async function (octokit, owner, name, tag) {
  const tags = new Set();

  for await (const pkgVer of iteratePackageVersions(octokit, owner, name)) {
    const versionTags = pkgVer.metadata.container.tags;

    if (versionTags.includes(tag)) {
      return pkgVer;
    } else {
      versionTags.map((item) => {
        tags.add(item);
      });
    }
  }

  throw new Error(
    `package with tag '${tag}' does not exits, available tags: ${Array.from(
      tags
    ).join(", ")}`
  );
};

let findPackageVersionsUntaggedOrderGreaterThan = async function (
  octokit,
  owner,
  name
) {
  const pkgs = [];

  for await (const pkgVer of iteratePackageVersions(octokit, owner, name)) {
    const versionTags = pkgVer.metadata.container.tags;
    if (versionTags.length == 0) {
      pkgs.push(pkgVer);
    }
  }
  return pkgs;
};

let iteratePackageVersions = async function* (octokit, owner, name) {
  for await (const response of octokit.paginate.iterator(
    octokit.rest.packages.getAllPackageVersionsForPackageOwnedByUser,
    {
      package_type: "container",
      package_name: name,
      username: owner
    }
  )) {
    for (let packageVersion of response.data) {
      yield packageVersion;
    }
  }
};

let deletePackageVersion = async (octokit, owner, name, versionId) => {
  await octokit.rest.packages.deletePackageVersionForUser({
    package_type: "container",
    package_name: name,
    username: owner,
    package_version_id: versionId,
  });
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  getConfig,
  findPackageVersionByTag,
  deletePackageVersion,
  findPackageVersionsUntaggedOrderGreaterThan,
  sleep,
};
