const compareFunc = (org1, org2) => (org1.slug < org2.slug ? -1 : 1);

const sortOrganizations = (organizationArr) =>
  organizationArr.sort(compareFunc);
export default sortOrganizations;
