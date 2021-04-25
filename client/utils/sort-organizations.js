const compareFunc = (org1, org2) => (org1.slug < org2.slug ? -1 : 1);

const sortOrganizations = (organizationArr) => {
  return organizationArr.sort(compareFunc);
};
export default sortOrganizations;
