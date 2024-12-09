// This is a temporary fix to prevent import errors
// while the application transitions to using Firebase
export const supabase = {
  auth: {
    onAuthStateChange: () => {},
    getSession: async () => null,
    signOut: async () => {}
  },
  from: () => ({
    select: () => Promise.resolve([]),
    insert: () => Promise.resolve([]),
    update: () => Promise.resolve([]),
    delete: () => Promise.resolve([])
  })
};

console.log('Supabase client initialized with mock implementation');