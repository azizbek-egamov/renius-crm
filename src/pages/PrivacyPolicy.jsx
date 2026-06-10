const PrivacyPolicy = () => {
    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '40px 24px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#333',
            lineHeight: '1.7',
        }}>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                Privacy Policy
            </h1>
            <p style={{ color: '#666', marginBottom: '32px' }}>
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>1. Information We Collect</h2>
                <p>When you connect your Instagram account, we access:</p>
                <ul>
                    <li>Your Instagram profile information (username, profile picture, bio)</li>
                    <li>Your follower and following counts</li>
                    <li>Your media posts and their engagement metrics</li>
                    <li>Account insights and analytics data</li>
                </ul>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>2. How We Use Your Information</h2>
                <p>We use the collected information solely to:</p>
                <ul>
                    <li>Display your Instagram statistics and analytics within our CRM dashboard</li>
                    <li>Provide engagement metrics and insights for your posts</li>
                    <li>Help you track your Instagram account performance</li>
                </ul>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>3. Data Storage</h2>
                <p>
                    We store your Instagram access token securely on our server to maintain your connection.
                    We do not sell, share, or distribute your data to any third parties.
                </p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>4. Data Deletion</h2>
                <p>
                    You can disconnect your Instagram account at any time from the Instagram Statistics page.
                    Upon disconnection, all stored tokens and data are immediately deleted from our system.
                </p>
            </section>

            <section style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>5. Contact</h2>
                <p>
                    If you have any questions about this Privacy Policy, please contact us through the application.
                </p>
            </section>
        </div>
    );
};

export default PrivacyPolicy;
