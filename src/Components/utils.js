export const getSortedUsers = (users, currentUser, chatsMap, activeChatId) => {
  if (!currentUser) return users;

  let merged = [
    { ...currentUser, isSelf: true, username: `${currentUser.username} (You)` },
    ...users.filter(u => u.id !== currentUser.uid)
  ];

  // Move active chat user immediately after self
  let activeUser;
  if (activeChatId) {
    const idx = merged.findIndex(u => u.id === activeChatId);
    if (idx > 0) activeUser = merged.splice(idx, 1)[0];
  }

  // Separate users with unread and without unread
  const usersWithUnread = [];
  const usersWithoutUnread = [];
  for (let i = 1; i < merged.length; i++) {
    const user = merged[i];
    const unreadCount = chatsMap[user.id]?.unreadCount || 0;
    if (unreadCount > 0) usersWithUnread.push(user);
    else usersWithoutUnread.push(user);
  }

  let finalList = [merged[0]]; // self
  if (activeUser) finalList.push(activeUser);
  finalList = finalList.concat(usersWithUnread, usersWithoutUnread);
  return finalList;
};
