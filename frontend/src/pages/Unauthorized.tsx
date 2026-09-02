function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page.
        </p>
        <a
          href="/"
          className="text-primary-600 hover:text-primary-800 font-medium"
        >
          Go back to home
        </a>
      </div>
    </div>
  );
}

export default Unauthorized;
