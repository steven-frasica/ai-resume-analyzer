import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router';
import { usePuterStore } from '~/lib/puter';

export const meta = () => ([
  { title: 'Resumind | Review' },
  { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
  // Pull auth state plus Puter file/kv helpers used to rebuild a saved resume review.
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();

  // These URLs are created from Puter file blobs so the page can preview the uploaded resume.
  const [imageUrl, setImageUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  // The saved AI response is rendered on the right side of the review page.
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // If auth has finished loading and the user is not signed in, send them to the login route.
    if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
  }, [isLoading])

  useEffect(() => {
    // Rehydrate the saved review by loading its metadata from KV, then fetch the stored PDF and preview image.
    const loadResume = async () => {
      const resume = await kv.get(`resume:${id}`);

      if (!resume) return;

      // The KV record stores the Puter file paths plus the previously generated AI feedback.
      const data = JSON.parse(resume);

      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;

      // Convert the stored PDF blob into an object URL so the preview can open in a new tab.
      const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
      const resumeUrl = URL.createObjectURL(pdfBlob);

      setResumeUrl(resumeUrl);

      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return;

      // The uploaded first-page image is what the page renders as the visual resume preview.
      const imageUrl = URL.createObjectURL(imageBlob);

      setImageUrl(imageUrl);

      setFeedback(data.feedback)
      console.log({ resumeUrl, imageUrl, feedback: data.feedback })
    }

    loadResume();
  }, [id])

  return (
    <main className="!pt-0">
      {/* Simple back navigation to return from an individual review to the dashboard/home page. */}
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        {/* Left pane shows the stored resume preview and links to the original uploaded PDF. */}
        <section className="feedback-section bg-[url('/image/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className='animate-in fade-in duration-1000 gradient-border max-sm:m-0 h=[90%] max-wxl:h-fit w-fit'>
              <a href={resumeUrl} target="_blank">
                <img src={imageUrl} alt="" className='w-full h-full object-contain rounded-2xl' />
              </a>
            </div>
          )}
        </section>
        {/* Right pane swaps from a loading animation to the parsed AI feedback once the saved record is available. */}
        <section className="feedback-section">
          <h2 className="text-4xl !text-bacl font-bold">Resume Review</h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              Summary ATS Details
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className='w-full' alt="" />
          )}
        </section>
      </div>
    </main>
  )
}

export default Resume