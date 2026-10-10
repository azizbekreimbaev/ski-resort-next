$ErrorActionPreference = 'Stop'

$endpoint = 'http://localhost:3007/graphql'
$sharedPassword = 'test123'

function Invoke-GraphQL {
	param(
		[Parameter(Mandatory = $true)][string]$Query,
		[hashtable]$Variables = @{},
		[string]$Token = ''
	)
	$headers = @{}
	if ($Token) { $headers.Authorization = "Bearer $Token" }
	$body = @{ query = $Query; variables = $Variables } | ConvertTo-Json -Depth 25 -Compress
	$response = Invoke-RestMethod -Uri $endpoint -Method Post -ContentType 'application/json' -Headers $headers -Body $body
	if ($response.errors) {
		$messages = ($response.errors | ForEach-Object { $_.message }) -join ' | '
		throw $messages
	}
	return $response.data
}

$nicks = @('Kevin','Olivia','Ethan','Sophia','Liam','Chloe','Noah','Amelia','Lucas','Grace','Mason','Harper','Owen','Ruby','Jack')
$loginMutation = 'mutation Login($input: LoginInput!) { login(input: $input) { _id memberNick memberType memberStatus accessToken } }'
$sessions = @{}
foreach ($nick in $nicks) {
	$data = Invoke-GraphQL -Query $loginMutation -Variables @{ input = @{ memberNick = $nick; memberPassword = $sharedPassword } }
	$sessions[$nick] = $data.login
}

$resortQuery = 'query Resorts($input: ResortsInquiry!) { getResorts(input: $input) { list { _id resortTitle resortImages } metaCounter { total } } }'
$resortData = Invoke-GraphQL -Query $resortQuery -Variables @{ input = @{ page = 1; limit = 100; sort = 'createdAt'; direction = 'DESC'; search = @{} } }
$resorts = @($resortData.getResorts.list)
if ($resorts.Count -lt 1) { throw 'At least one visible Resort is required before community seeding.' }

$articleImages = @(
	'uploads/resort/02d2b155-d793-45e3-bad2-8846c169d58d.jpg',
	'uploads/resort/31f45b69-132b-4522-a187-22bae8202d25.jpg',
	'uploads/resort/767637c1-3749-461b-8a47-467242844b8a.jpg',
	'uploads/resort/cc636e4b-4829-4551-9be2-71f43fb1e6ce.jpg'
)
$articleSpecs = @(
	@{ author='Olivia'; category='TIPS_GUIDES'; title='Your First Ski Day Checklist'; content='Pack gloves, goggles, sunscreen, water, and a dry base layer. Arrive early for fitting, warm up gently, and save energy for a calm final run.' },
	@{ author='Ethan'; category='TIPS_GUIDES'; title='How Rental Boots Should Feel'; content='A good ski boot feels snug without numb toes. Your heel should stay planted when you flex, while buckles remain firm rather than painfully tight.' },
	@{ author='Sophia'; category='NEWS'; title='Opening Weekend Mountain Notes'; content='Early-season terrain is expanding across Korea. Check lift notices before departure, reserve rentals ahead, and expect colder shaded slopes after lunch.' },
	@{ author='Liam'; category='REVIEWS'; title='A Relaxed Family Day on Snow'; content='Wide learning slopes, patient staff, warm indoor breaks, and nearby food made this an easy day for mixed abilities. Morning arrival kept every transition simple.' },
	@{ author='Chloe'; category='GENERAL'; title='Favorite Cafes After Night Skiing'; content='The best post-ski stop has boot-friendly floors, hot tea, simple food, and a clear view of the lit slopes. Share your favorite mountain cafe below.' },
	@{ author='Noah'; category='QUESTIONS'; title='What Happens in a Beginner Lesson'; content='Should a first lesson focus on stopping, lift use, or linking turns? I would love to hear which skill helped you feel independent fastest.' },
	@{ author='Amelia'; category='TIPS_GUIDES'; title='Chairlift Etiquette Made Simple'; content='Lower the bar carefully, keep poles secure, leave space when unloading, and move away from the exit ramp before regrouping with friends.' },
	@{ author='Lucas'; category='TIPS_GUIDES'; title='A Stable Snowboard Park Setup'; content='Start with centered bindings, comfortable angles, and freshly checked hardware. Small features reward balance and clean landings more than speed.' },
	@{ author='Grace'; category='GENERAL'; title='A Quiet Morning in Pyeongchang'; content='Fresh corduroy, pale winter light, and the first gondola made the mountain feel unhurried. The calm hour before crowds arrived was worth the early alarm.' },
	@{ author='Mason'; category='TIPS_GUIDES'; title='Helmet Fit Matters Most'; content='A helmet should sit level, stay secure without the chin strap, and leave no large gap above your goggles. Replace it after a serious impact.' },
	@{ author='Harper'; category='NEWS'; title='Resort Shuttle Planning Update'; content='Weekend shuttles can fill quickly during peak winter dates. Confirm the pickup point, boarding time, luggage policy, and return departure before booking.' },
	@{ author='Owen'; category='QUESTIONS'; title='Which Pass Fits a Short Visit'; content='For a four-hour trip, do you prefer a morning, afternoon, or night pass? I am comparing value, crowds, and the best snow window for an easy day.' }
)

$articleListQuery = 'query Articles($input: BoardArticlesInquiry!) { getBoardArticles(input: $input) { list { _id articleTitle articleCategory memberId } metaCounter { total } } }'
$existingArticleData = Invoke-GraphQL -Query $articleListQuery -Variables @{ input = @{ page = 1; limit = 100; sort = 'createdAt'; direction = 'DESC'; search = @{} } }
$articleByTitle = @{}
foreach ($item in @($existingArticleData.getBoardArticles.list)) { $articleByTitle[$item.articleTitle] = $item }
$createArticleMutation = 'mutation CreateArticle($input: BoardArticleInput!) { createBoardArticle(input: $input) { _id articleTitle articleCategory memberId } }'
$articles = @()
for ($i = 0; $i -lt $articleSpecs.Count; $i++) {
	$spec = $articleSpecs[$i]
	if ($articleByTitle.ContainsKey($spec.title)) {
		$articles += $articleByTitle[$spec.title]
		continue
	}
	$data = Invoke-GraphQL -Query $createArticleMutation -Token $sessions[$spec.author].accessToken -Variables @{
		input = @{
			articleCategory = $spec.category
			articleTitle = $spec.title
			articleContent = $spec.content
			articleImage = $articleImages[$i % $articleImages.Count]
		}
	}
	$articles += $data.createBoardArticle
}

$applicationSpecs = @(
	@{ nick='Olivia'; years=6; languages=@('English','Korean'); level='ALL'; audience='FAMILY'; bio='Family ski coach focused on calm progress and safe first turns.' },
	@{ nick='Ethan'; years=9; languages=@('English','Korean'); level='ADVANCED'; audience='PRIVATE'; bio='Carving and advanced terrain coach with a structured technical approach.' },
	@{ nick='Sophia'; years=5; languages=@('English','Korean'); level='BEGINNER'; audience='KIDS'; bio='Playful kids instructor who builds confidence through simple snow games.' },
	@{ nick='Liam'; years=8; languages=@('English','Korean','French'); level='ALL'; audience='ADULTS'; bio='All-level alpine coach for adults improving balance, rhythm, and control.' },
	@{ nick='Chloe'; years=4; languages=@('English','Korean'); level='BEGINNER'; audience='FAMILY'; bio='Welcoming beginner instructor for relaxed family learning sessions.' },
	@{ nick='Noah'; years=11; languages=@('English','Korean','Japanese'); level='ADVANCED'; audience='PRIVATE'; bio='Private coach helping strong riders progress safely on steeper terrain.' },
	@{ nick='Amelia'; years=3; languages=@('English','Korean'); level='INTERMEDIATE'; audience='ADULTS'; bio='Patient coach for adults linking turns and exploring more of the mountain.' },
	@{ nick='Lucas'; years=7; languages=@('English','Korean'); level='INTERMEDIATE'; audience='PRIVATE'; bio='Snowboard-focused instructor emphasizing stable stance and clean turns.' },
	@{ nick='Grace'; years=6; languages=@('English','Korean','Spanish'); level='ALL'; audience='FAMILY'; bio='Family instructor experienced with mixed abilities and shared lesson goals.' },
	@{ nick='Mason'; years=10; languages=@('English','Korean'); level='ADVANCED'; audience='ADULTS'; bio='Technique coach helping intermediate skiers unlock confident carving.' },
	@{ nick='Harper'; years=2; languages=@('English','Korean'); level='BEGINNER'; audience='KIDS'; bio='New instructor candidate committed to patient, positive kids lessons.' },
	@{ nick='Owen'; years=4; languages=@('English','Korean'); level='INTERMEDIATE'; audience='ADULTS'; bio='Lesson leader focused on practical control and mountain awareness.' }
)
$myApplicationQuery = 'query MyApplication { getMyInstructorApplication { _id applicationStatus memberId } }'
$createApplicationMutation = 'mutation Apply($input: InstructorApplicationInput!) { createInstructorApplication(input: $input) { _id applicationStatus memberId } }'
$applications = @()
for ($i = 0; $i -lt $applicationSpecs.Count; $i++) {
	$spec = $applicationSpecs[$i]
	$current = Invoke-GraphQL -Query $myApplicationQuery -Token $sessions[$spec.nick].accessToken
	if ($current.getMyInstructorApplication) {
		$applications += $current.getMyInstructorApplication
		continue
	}
	$data = Invoke-GraphQL -Query $createApplicationMutation -Token $sessions[$spec.nick].accessToken -Variables @{
		input = @{
			instructorExperienceYears = $spec.years
			instructorLanguages = $spec.languages
			instructorLevel = $spec.level
			instructorAudience = $spec.audience
			instructorResortId = $resorts[$i % $resorts.Count]._id
			memberDesc = $spec.bio
		}
	}
	$applications += $data.createInstructorApplication
}

$subscribeMutation = 'mutation Subscribe($input: String!) { subscribe(input: $input) { _id followerId followingId } }'
$follows = @()
for ($i = 0; $i -lt $nicks.Count; $i++) {
	$follower = $sessions[$nicks[$i]]
	$following = $sessions[$nicks[($i + 1) % $nicks.Count]]
	$data = Invoke-GraphQL -Query $subscribeMutation -Token $follower.accessToken -Variables @{ input = $following._id }
	$follows += $data.subscribe
}

$getResort = 'query Resort($id: String!) { getResort(resortId: $id) { _id meLiked { myFavorite } } }'
$likeResort = 'mutation LikeResort($id: String!) { likeTargetResort(resortId: $id) { _id resortLikes } }'
$getArticle = 'query Article($id: String!) { getBoardArticle(articleId: $id) { _id meLiked { myFavorite } } }'
$likeArticle = 'mutation LikeArticle($id: String!) { likeTargetBoardArticle(articleId: $id) { _id articleLikes } }'
$getMember = 'query Member($id: String!) { getMember(memberId: $id) { _id meLiked { myFavorite } } }'
$likeMember = 'mutation LikeMember($id: String!) { likeTargetMember(memberId: $id) { _id memberLikes } }'
$likeCount = 0
for ($i = 0; $i -lt $nicks.Count; $i++) {
	$session = $sessions[$nicks[$i]]
	$kind = $i % 3
	if ($kind -eq 0) {
		$target = $resorts[$i % $resorts.Count]._id
		$current = Invoke-GraphQL -Query $getResort -Token $session.accessToken -Variables @{ id = $target }
		if (-not ($current.getResort.meLiked | Where-Object { $_.myFavorite })) {
			Invoke-GraphQL -Query $likeResort -Token $session.accessToken -Variables @{ id = $target } | Out-Null
		}
	} elseif ($kind -eq 1) {
		$target = $articles[$i % $articles.Count]._id
		$current = Invoke-GraphQL -Query $getArticle -Token $session.accessToken -Variables @{ id = $target }
		if (-not ($current.getBoardArticle.meLiked | Where-Object { $_.myFavorite })) {
			Invoke-GraphQL -Query $likeArticle -Token $session.accessToken -Variables @{ id = $target } | Out-Null
		}
	} else {
		$target = $sessions[$nicks[($i + 2) % $nicks.Count]]._id
		$current = Invoke-GraphQL -Query $getMember -Token $session.accessToken -Variables @{ id = $target }
		if (-not ($current.getMember.meLiked | Where-Object { $_.myFavorite })) {
			Invoke-GraphQL -Query $likeMember -Token $session.accessToken -Variables @{ id = $target } | Out-Null
		}
	}
	$likeCount++
}

$commentTexts = @(
	'This checklist is exactly what I needed before my first lesson.',
	'The heel-hold tip made my last rental fitting much more comfortable.',
	'Thanks for the clear update. I will book the shuttle and rental early.',
	'The morning session sounds ideal for families and first-time skiers.',
	'A warm cafe with a slope view is my favorite way to finish the day.',
	'Stopping first gave me the confidence to enjoy every later skill.',
	'Clear etiquette makes busy lift lines calmer for everyone.',
	'I am trying this setup before my next beginner park session.',
	'The quiet first hour is always worth an early start.',
	'Great reminder to check the helmet and goggles together.',
	'I appreciate the practical transport details for weekend planning.',
	'An afternoon pass usually gives me the best balance of time and value.',
	'This resort looks welcoming for a relaxed group trip.',
	'The facilities list makes planning a family day much easier.',
	'I would love to visit for a calm weekday session.'
)
$commentsQuery = 'query Comments($input: CommentsInquiry!) { getComments(input: $input) { list { _id memberId commentContent commentGroup commentRefId } metaCounter { total } } }'
$createComment = 'mutation Comment($input: CommentInput!) { createComment(input: $input) { _id memberId commentContent commentGroup commentRefId } }'
$commentCount = 0
for ($i = 0; $i -lt $commentTexts.Count; $i++) {
	if ($i -lt 12) {
		$group = 'ARTICLE'
		$refId = $articles[$i]._id
	} else {
		$group = 'RESORT'
		$refId = $resorts[$i % $resorts.Count]._id
	}
	$author = $sessions[$nicks[($i + 3) % $nicks.Count]]
	$current = Invoke-GraphQL -Query $commentsQuery -Variables @{ input = @{ page = 1; limit = 100; sort = 'createdAt'; direction = 'DESC'; search = @{ commentRefId = $refId; commentGroup = $group } } }
	$exists = @($current.getComments.list) | Where-Object { $_.memberId -eq $author._id -and $_.commentContent -eq $commentTexts[$i] }
	if (-not $exists) {
		Invoke-GraphQL -Query $createComment -Token $author.accessToken -Variables @{ input = @{ commentGroup = $group; commentContent = $commentTexts[$i]; commentRefId = $refId } } | Out-Null
	}
	$commentCount++
}

[pscustomobject]@{
	membersAuthenticated = $sessions.Count
	resortsAvailable = $resorts.Count
	articlesReady = $articles.Count
	instructorApplicationsReady = $applications.Count
	followsReady = $follows.Count
	likesAndAuthenticatedViewsReady = $likeCount
	commentsReady = $commentCount
} | ConvertTo-Json -Compress
