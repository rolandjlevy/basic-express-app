const formatUsersContent = (data) =>
  data.reduce((acc, item) => {
    const { _id, date, username, email } = item;
    acc += `
    <ul>
      <li>id: <a href='/user/id/${_id}'>${_id}</a></li>
      <li>username: <a href='/user/search/${username}'>${username}</a></li>
      <li>date: ${date}</li>
      <li>email: ${email}</li>
    </ul>`;
    return acc;
  }, "");

module.exports = {
  formatUsersContent,
};
