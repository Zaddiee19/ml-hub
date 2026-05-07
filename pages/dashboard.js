
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [articles, setArticles] = useState([])
  const [likedArticles, setLikedArticles] = useState({})
  const [newTitle, setNewTitle] = useState('')
  const [newPost, setNewPost] = useState('')

  const [comments, setComments] = useState({})
  const [commentInputs, setCommentInputs] = useState({})

  const [replies, setReplies] = useState({})
  const [replyInputs, setReplyInputs] = useState({})

  const [loading, setLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)



  // =====================================
  // NEW UI DESIGN SYSTEM
  // =====================================

  const glass = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)'
  }

  const inputStyle = {
    width: '100%',
    padding: '18px 22px',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(15,23,42,0.65)',
    color: 'white',
    fontSize: 16,
    outline: 'none',
    marginBottom: 16
  }

  const buttonBase = {
    padding: '16px 26px',
    borderRadius: 18,
    border: 'none',
    cursor: 'pointer',
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    transition: 'all 0.25s ease',
    letterSpacing: 0.3,
    transform: 'translateZ(0)',
    willChange: 'transform'
  }

  const buttonHover = (e, type) => {
    const btn = e.currentTarget

    if (btn.disabled) return

    switch (type) {
      case 'enter':
        btn.style.transform = 'translateY(-3px) scale(1.02)'
        btn.style.opacity = '0.92'
        break

      case 'leave':
        btn.style.transform = 'translateY(0px) scale(1)'
        btn.style.opacity = '1'
        break

      case 'down':
        btn.style.transform = 'scale(0.96)'
        break

      case 'up':
        btn.style.transform = 'translateY(-3px) scale(1.02)'
        break

      default:
        break
    }
  }

  // =====================================
  // AUTH
  // =====================================

  useEffect(() => {
    let mounted = true

    const checkUser = async () => {
      try {
        setLoading(true)

        const { data: sessionData } =
          await supabase.auth.getSession()

        if (!sessionData?.session) {
          router.push('/login')
          return
        }

        const { data: userData } =
          await supabase.auth.getUser()

        if (!userData?.user) {
          router.push('/login')
          return
        }

        if (!mounted) return

        setUser(userData.user)
        setIsVerified(!!userData.user.email_confirmed_at)

        await fetchArticles()
        await fetchComments()
        await fetchReplies()

      } catch (err) {
        console.error(err)
        router.push('/login')
      }

      if (mounted) setLoading(false)
    }

    checkUser()

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!session?.user) return

          const { data } =
            await supabase.auth.getUser()

          if (!data?.user) return

          setUser(data.user)
          setIsVerified(
            !!data.user.email_confirmed_at
          )
        }
      )

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // =====================================
  // FETCH ARTICLES
  // =====================================

  const fetchArticles = async () => {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('likes', { ascending: false })

    setArticles(data || [])
  }

  // =====================================
  // FETCH COMMENTS
  // =====================================

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    const grouped = {}

    data.forEach(comment => {
      if (!grouped[comment.article_id]) {
        grouped[comment.article_id] = []
      }

      grouped[comment.article_id].push(comment)
    })

    setComments(grouped)
  }
  //fetch replies//
  const fetchReplies = async () => {
    const { data, error } = await supabase
      .from('replies')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    const grouped = {}

    data.forEach(reply => {
      if (!grouped[reply.comment_id]) {
        grouped[reply.comment_id] = []
      }

      grouped[reply.comment_id].push(reply)
    })

    setReplies(grouped)
  }

  // =====================================
  // PUBLISH ARTICLE
  // =====================================

  const publishArticle = async () => {
    if (!isVerified) {
      alert('Verify your email first!')
      return
    }

    if (!newTitle || !newPost) return

    const { data } =
      await supabase.auth.getUser()

    await supabase.from('articles').insert({
      title: newTitle,
      content: newPost,
      user_id: data.user.id,
      likes: 0,
      created_at: new Date().toISOString()
    })

    setNewTitle('')
    setNewPost('')
    fetchArticles()
  }

  // =====================================
  // LIKE
  // =====================================
  const toggleLike = async (id) => {
    const isLiked = likedArticles[id]

    setLikedArticles(prev => ({
      ...prev,
      [id]: !isLiked
    }))

    setArticles(prev =>
      prev.map(article =>
        article.id === id
          ? {
            ...article,
            likes: isLiked
              ? article.likes - 1
              : article.likes + 1
          }
          : article
      )
    )

    const target = articles.find(a => a.id === id)
    if (!target) return

    const newLikes = isLiked
      ? target.likes - 1
      : target.likes + 1

    try {
      const { error } = await supabase
        .from('articles')
        .update({ likes: newLikes })
        .eq('id', id)

      if (error) throw error

    } catch (error) {
      console.error(error)

      setLikedArticles(prev => ({
        ...prev,
        [id]: isLiked
      }))

      setArticles(prev =>
        prev.map(article =>
          article.id === id
            ? {
              ...article,
              likes: isLiked
                ? article.likes + 1
                : article.likes - 1
            }
            : article
        )
      )
    }
  }
  // =====================================
  // ADD COMMENT
  // =====================================

  const addComment = async (articleId) => {
    const text = commentInputs[articleId]

    if (!text || !text.trim()) return

    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser()

    if (!currentUser) return

    const { data, error } = await supabase
      .from('comments')
      .insert({
        article_id: articleId,
        user_id: currentUser.id,
        text: text
      })
      .select()

    if (error) {
      console.log("SUPABASE ERROR:", error)
      alert(error.message)
      return
    }
    const newComment = data?.[0]

    if (!newComment) return

    // ensure UI consistency
    const formattedComment = {
      ...newComment,
      content: newComment.text // optional fallback compatibility
    }

    setComments(prev => ({
      ...prev,
      [articleId]: [
        ...(prev[articleId] || []),
        formattedComment
      ]
    }))
  }

  //add reply
  const addReply = async (commentId) => {
    const text = replyInputs[commentId]

    if (!text || !text.trim()) return

    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser()

    if (!currentUser) return

    const { data, error } = await supabase
      .from('replies')
      .insert({
        comment_id: commentId,
        user_id: currentUser.id,
        text
      })
      .select()

    if (error) {
      console.error(error)
      return
    }

    const newReply = data?.[0]

    if (!newReply) return

    setReplies(prev => ({
      ...prev,
      [commentId]: [
        ...(prev[commentId] || []),
        newReply
      ]
    }))

    setReplyInputs(prev => ({
      ...prev,
      [commentId]: ''
    }))
  }

  //delete comment
  const deleteComment = async (commentId, articleId) => {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser()

    if (!currentUser) return

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error(error)
      return
    }

    // update UI after delete
    setComments(prev => ({
      ...prev,
      [articleId]: prev[articleId].filter(c => c.id !== commentId)
    }))
  }

  //delete reply

  const deleteReply = async (replyId, commentId) => {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser()

    if (!currentUser) return

    const { error } = await supabase
      .from('replies')
      .delete()
      .eq('id', replyId)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error(error)
      return
    }

    setReplies(prev => ({
      ...prev,
      [commentId]: prev[commentId].filter(
        r => r.id !== replyId
      )
    }))
  }


  // =====================================
  // DELETE ARTICLE
  // =====================================

  const deleteArticle = async (
    id,
    articleUserId
  ) => {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser()

    if (!currentUser) {
      alert('Not logged in')
      return
    }

    if (
      currentUser.id !== articleUserId
    ) {
      alert(
        'You are not the owner of this article'
      )
      return
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .eq('user_id', currentUser.id)

    if (error) {
      console.error(error)
      return
    }

    setArticles(prev =>
      prev.filter(a => a.id !== id)
    )
  }


  // =====================================
  // SHARE TO MULTIPLE PLATFORMS
  // =====================================

  const shareArticle = async (article) => {
    const link =
      `${window.location.origin}/article/${article.id}`

    const shareData = {
      title: article.title,
      text: article.content?.slice(0, 100) + '...',
      url: link
    }

    // Native mobile/browser share support
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Share cancelled')
      }

      return
    }

    // fallback menu for desktop
    const encodedURL = encodeURIComponent(link)
    const encodedText = encodeURIComponent(
      `${article.title}`
    )

    const options = `
Choose platform:

1 = Facebook
2 = Twitter/X
3 = WhatsApp
4 = Telegram
5 = Copy Link
`

    const choice = prompt(options)

    switch (choice) {
      case '1':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`,
          '_blank'
        )
        break

      case '2':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodedURL}&text=${encodedText}`,
          '_blank'
        )
        break

      case '3':
        window.open(
          `https://wa.me/?text=${encodedText}%20${encodedURL}`,
          '_blank'
        )
        break

      case '4':
        window.open(
          `https://t.me/share/url?url=${encodedURL}&text=${encodedText}`,
          '_blank'
        )
        break

      case '5':
        navigator.clipboard.writeText(link)
        alert('🔗 Link copied!')
        break

      default:
        break
    }
  }
  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: 'white',
          fontSize: 24,
          fontWeight: 700
        }}
      >
        Loading Dashboard...
      </div>
    )
  }

  // =====================================
  // UI
  // =====================================

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea)',
        padding: '40px 20px',
        color: 'white'
      }}
    >
      {/* HEADER */}

      <div
        style={{
          ...glass,
          maxWidth: 1200,
          margin: '0 auto 40px',
          borderRadius: 28,
          padding: '24px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 38,
              fontWeight: 900
            }}
          >
            ML HUB
          </h1>

          <p
            style={{
              marginTop: 6,
              opacity: 0.7
            }}
          >
            Modern Article Platform
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18
          }}
        >
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 16,
              background:
                'rgba(255,255,255,0.08)',
              fontSize: 14
            }}
          >
            {user?.email}
          </div>

          <button
            style={{
              ...buttonBase,
              background: '#dc2626'
            }}
            onClick={handleLogout}
            onMouseEnter={(e) => buttonHover(e, 'enter')}
            onMouseLeave={(e) => buttonHover(e, 'leave')}
            onMouseDown={(e) => buttonHover(e, 'down')}
            onMouseUp={(e) => buttonHover(e, 'up')}
          >
            Logout
          </button>
        </div>
      </div>

      {/* CREATE ARTICLE */}

      <div
        style={{
          ...glass,
          maxWidth: 1200,
          margin: '0 auto 35px',
          borderRadius: 30,
          padding: 35
        }}
      >
        <h2
          style={{
            marginTop: 0,
            fontSize: 30,
            marginBottom: 25
          }}
        >
          Create New Article
        </h2>

        <input
          placeholder='Article title...'
          value={newTitle}
          onChange={e =>
            setNewTitle(e.target.value)
          }
          style={inputStyle}
        />

        <textarea
          placeholder='Write your article...'
          value={newPost}
          onChange={e =>
            setNewPost(e.target.value)
          }
          style={{
            ...inputStyle,
            minHeight: 180,
            resize: 'none'
          }}
        />

        <button
          disabled={!isVerified}
          style={{
            ...buttonBase,
            background: isVerified
              ? '#2563eb'
              : '#64748b',
            width: '100%',
            marginTop: 10,
            padding: '18px'
          }}
          onClick={publishArticle}
          onMouseEnter={(e) =>
            buttonHover(e, true)
          }
          onMouseLeave={(e) =>
            buttonHover(e, false)
          }
        >
          {isVerified
            ? 'Publish Article'
            : 'Verify Email First'}
        </button>
      </div>

      {/* ARTICLES */}

      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto'
        }}
      >
        {articles.map(article => {
          const isLiked =
            likedArticles[article.id]

          return (
            <div
              key={article.id}
              style={{
                ...glass,
                borderRadius: 30,
                padding: 35,
                marginBottom: 30
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom: 20
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 34,
                    fontWeight: 800
                  }}
                >
                  {article.title}
                  <p
                    style={{
                      fontSize: 13,
                      opacity: 0.7,
                      marginTop: 6
                    }}
                  >
                    Published Time:
                    {' '}
                    {new Date(article.created_at).toLocaleString()}
                  </p>
                </h2>

                <div
                  style={{
                    padding:
                      '10px 16px',
                    borderRadius: 14,
                    background:
                      'rgba(255,255,255,0.08)',
                    fontSize: 14
                  }}
                >
                  ❤️ {article.likes}
                </div>
              </div>

              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.9,
                  opacity: 0.92
                }}
              >
                {article.content}
              </p>

              {/* BUTTONS */}

              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  flexWrap: 'wrap',
                  marginTop: 28
                }}
              >
                <button
                  style={{
                    ...buttonBase,
                    background: likedArticles[article.id] ? '#10b981' : '#2563eb'
                  }}
                  onClick={() => toggleLike(article.id)}
                >
                  {likedArticles[article.id] ? 'Liked' : 'Like'}
                </button>

                <button
                  style={{
                    ...buttonBase,
                    background: '#0ea5e9'
                  }}
                  onClick={() =>
                    shareArticle(article.id)
                  }
                  onMouseEnter={(e) =>
                    buttonHover(e, true)
                  }
                  onMouseLeave={(e) =>
                    buttonHover(e, false)
                  }
                >
                  Share
                </button>

                {user?.id ===
                  article.user_id && (
                    <button
                      style={{
                        ...buttonBase,
                        background:
                          '#7c3aed'
                      }}
                      onClick={() =>
                        deleteArticle(
                          article.id,
                          article.user_id
                        )
                      }
                      onMouseEnter={(e) =>
                        buttonHover(e, true)
                      }
                      onMouseLeave={(e) =>
                        buttonHover(e, false)
                      }
                    >
                      Delete
                    </button>
                  )}
              </div>

              {/* COMMENT INPUT BOX */}
              <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
                <input
                  placeholder='Write comment...'
                  value={commentInputs[article.id] || ''}
                  onChange={(e) =>
                    setCommentInputs(prev => ({
                      ...prev,
                      [article.id]: e.target.value
                    }))
                  }
                  style={{
                    ...inputStyle,
                    marginBottom: 0
                  }}
                />

                <button
                  style={{
                    ...buttonBase,
                    background: '#9333ea',
                    minWidth: 170
                  }}
                  onClick={() => addComment(article.id)}
                >
                  Comment
                </button>
              </div>

              {/* COMMENT LIST - EACH COMMENT IN ITS OWN BOX */}
              <div style={{ marginTop: 10 }}>
                {(comments[article.id] || []).map(comment => (
                  <div
                    key={comment.id}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 24,
                      padding: 22,
                      marginBottom: 14,
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    {/* separate comment box (NOT inline text) */}
                    <div style={{ fontSize: 16, lineHeight: 1.6 }}>
                      {comment.text}
                    </div>

                    {/* REPLY INPUT */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginTop: 16
                      }}
                    >
                      <input
                        placeholder='Write reply...'
                        value={replyInputs[comment.id] || ''}
                        onChange={(e) =>
                          setReplyInputs(prev => ({
                            ...prev,
                            [comment.id]: e.target.value
                          }))
                        }
                        style={{
                          ...inputStyle,
                          marginBottom: 0,
                          padding: '12px 16px',
                          fontSize: 14
                        }}
                      />

                      <button
                        style={{
                          ...buttonBase,
                          background: '#6366f1',
                          padding: '12px 18px',
                          fontSize: 14
                        }}
                        onClick={() => addReply(comment.id)}
                      >
                        Reply
                      </button>
                    </div>

                    {/* REPLIES */}
                    <div
                      style={{
                        marginTop: 18,
                        paddingLeft: 24,
                        borderLeft: '2px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      {(replies[comment.id] || []).map(reply => (
                        <div
                          key={reply.id}
                          style={{
                            background: 'rgba(255,255,255,0.04)',
                            padding: 16,
                            borderRadius: 18,
                            marginBottom: 12
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              lineHeight: 1.6
                            }}
                          >
                            {reply.text}
                          </div>

                          {user?.id === reply.user_id && (
                            <button
                              style={{
                                ...buttonBase,
                                background: '#2b18f7',
                                marginTop: 10,
                                padding: '8px 14px',
                                fontSize: 12
                              }}
                              onClick={() =>
                                deleteReply(reply.id, comment.id)
                              }
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {user?.id === comment.user_id && (
                      <button
                        style={{
                          ...buttonBase,
                          background: '#2b18f7',
                          marginTop: 12,
                          fontSize: 13,
                          padding: '10px 16px'
                        }}
                        onClick={() =>
                          deleteComment(comment.id, article.id)
                        }
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}