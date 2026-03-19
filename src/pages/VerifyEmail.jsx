import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function VerifyEmail() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const email = searchParams.get("email");

    const verify = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/auth/verify/${token}?email=${email}`
        );

        const data = await res.json();

        console.log(data);

        // ✅ SUCCESS
        if (data.token) {
          // 🔥 AUTO LOGIN
          localStorage.setItem("token", data.token);

          alert("Email verified & logged in!");

          // 🚀 Redirect to dashboard/home
          window.location.href = "/";
          return;
        }

        // ✅ Already verified
        if (data.message === "User already verified") {
          alert("Already verified. Please login.");
          window.location.href = "/login";
          return;
        }

        // ❌ Error
        if (!res.ok) throw new Error(data.error);

      } catch (err) {
        alert(err.message);
      }
    };

    if (token) verify();
  }, [token, searchParams]);

  return <h2>Verifying your email...</h2>;
}