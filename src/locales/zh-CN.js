export default {
  app: {
    title: "CodeRush OJ",
    welcome: "欢迎使用 CodeRush OJ",
  },
  routes: {
    home: "首页",
    dashboard: "控制台",
    problems: "题库",
    contests: "竞赛", 
    ranking: "排名",
    profile: "个人中心",
    settings: "设置",
    admin: "管理员",
    admin_users: "用户管理",
    admin_problems: "题目管理",
    admin_tags: "标签管理",
    admin_contests: "竞赛管理",
    admin_dashboard: "管理员控制台",
  },
  auth: {
    login: "登录",
    register: "注册",
    logout: "注销",
    logout_confirm: "您确定要退出登录吗？",
    account_label: "用户名或邮箱",
    username: "用户名",
    email: "邮箱",
    password: "密码",
    remember: "记住我",
    forgot_password: "忘记密码？",
    confirm_password: "确认密码",
    verification_code: "验证码",
    already_registered: "已有账号？",
    no_account: "没有账号？",
    register_success: "注册成功！请使用您的凭据登录。",
    welcome_back: "欢迎回来！",
    create_account: "创建您的账号",
    sign_in: "登录",
    sign_up: "注册",
    signing_in: "登录中...",
    registering: "注册中...",
    login_success: "登录成功！",
    verification_code: "验证码",
    get_verification_code: "获取验证码",
    refresh_verification_code: "刷新",
    captcha_note: "点击图片刷新验证码",
    login_hint: "请登录以访问此页面",
    permission_hint: "您没有权限访问此页面",
    email_code: '邮箱验证码',
    send_code: '发送验证码',
    code_sent: '重新发送',
  },
  validation: {
    username_required: "用户名不能为空",
    username_length: "用户名长度必须在3-20之间",
    username_format: "用户名只能包含字母、数字、下划线和连字符",
    username_exists: "该用户名已被占用",
    email_required: "邮箱不能为空",
    email_format: "请输入有效的邮箱地址",
    email_exists: "该邮箱已被注册",
    password_required: "密码不能为空",
    password_length: "密码长度必须在6-20之间",
    passwords_not_match: "两次密码不一致",
    confirm_password_required: "请确认您的密码",
    captcha_required: "验证码不能为空",
    email_code_required: "邮箱验证码不能为空",
    email_code_sent: '验证码已发送到您的邮箱',
    email_code_send_failed: '验证码发送失败'
  },
  errors: {
    login_failed: "登录失败，请检查您的凭据。",
    register_failed: "注册失败，请重试。",
    unknown_error: "发生未知错误",
    network_error: "网络错误，请稍后重试。",
    session_expired: "会话已过期，请重新登录。",
    unauthorized: "您无权访问此资源",
    captcha_error: "获取验证码失败",
    account_error: "用户名或密码错误",
    password_error: "密码错误",
    account_disabled: "您的账号已被禁用，请联系管理员",
    account_exists: "该账号已存在",
    passwords_not_match: "两次输入的密码不一致",
    email_code_error: "邮箱验证码错误或已过期",
    email_exists: "该邮箱已被注册",
    username_exists: "该用户名已被占用",
    parameter_error: "参数错误，请检查您的输入",
    account_not_exist: "该账号不存在",
    disabled_error: "无法禁用账户",
    email_verified: "该邮箱已验证",
    update_error: "更新失败",
    upload_error: "上传失败",
  },
  common: {
    loading: "加载中...",
    success: "成功",
    error: "错误",
    warning: "警告",
    info: "信息",
    confirm: "确认",
    cancel: "取消",
    save: "保存",
    edit: "编辑",
    delete: "删除",
    search: "搜索",
    filter: "筛选",
    reset: "重置",
    submit: "提交",
    actions: "操作",
    more: "更多",
    back: "返回",
    next: "下一步",
    previous: "上一步",
    language: "语言",
    close: "关闭",
    update: "更新",
    light_mode: '切换到亮色模式',
    dark_mode: '切换到暗色模式',
    view_code: '查看代码',
  },
  email: {
    verify_email: "验证您的邮箱",
    verification_required: "需要验证邮箱",
    verification_message: "请验证您的邮箱地址以访问所有功能。",
    send_verification: "发送验证邮件",
    verification_sent: "验证邮件已发送，请检查您的收件箱。",
    enter_verification_code: "输入您邮件中的验证码：",
    verification_code: "验证码",
    verify: "验证",
    verification_success: "邮箱验证成功",
    verification_success_message: "您的邮箱已成功验证，现在可以访问所有功能。",
    verification_failed: "邮箱验证失败",
    verification_failed_message: "验证码无效或已过期。",
    missing_parameters: "缺少用户ID或验证码。",
    go_to_login: "前往登录",
    go_to_dashboard: "前往控制台",
    invalid_link: "验证链接无效。",
    verifying_email: "正在验证您的邮箱...",
  },
  profile: {
    title: "个人资料设置",
    bio: "个人简介",
    github: "GitHub",
    school: "学校/组织",
    save_changes: "保存更改",
    reset: "重置",
    change_password: "修改密码",
    old_password: "当前密码",
    new_password: "新密码",
    confirm_password: "确认密码",
    update_password: "更新密码",
    update_success: "个人资料更新成功",
    update_error: "更新个人资料失败",
    password_update_success: "密码修改成功",
    password_update_error: "密码修改失败",
    load_error: "加载用户信息失败",
    old_password_required: "当前密码不能为空",
    new_password_required: "新密码不能为空",
    confirm_password_required: "请确认新密码",
    change_avatar: "更换头像",
    upload_avatar: "上传头像",
    avatar_size_limit: "头像大小不能超过2MB",
    avatar_type_error: "文件必须是图片格式",
    avatar_update_success: "头像更新成功",
    avatar_update_error: "头像更新失败",
    upload_avatar_confirm: "是否上传此头像？",
    upload: "上传",
    bio_max_length: "个人简介不能超过255个字符",
    github_max_length: "GitHub用户名不能超过100个字符",
    school_max_length: "学校/组织名称不能超过100个字符",
    verified: "已验证",
    unverified: "未验证",
    password_changed: "密码已修改",
    relogin_suggestion: "出于安全考虑，建议您使用新密码重新登录。",
    logout_now: "立即退出",
    later: "稍后",
  },
  dashboard: {
    greeting: "你好，{username}！",
    user_info: "用户信息",
    role: "角色",
    status: "状态",
    last_login: "最后登录",
    register_time: "注册时间",
    stats: "统计数据",
    solved_problems: "已解决问题",
    submissions: "提交记录",
    contests: "参与竞赛",
    recent_activities: "最近活动",
    no_activities: "暂无活动记录",
    verified: "已验证",
    unverified: "未验证",
  },
  settings: {
    title: "设置",
    theme_settings: "主题设置",
    theme_mode: "主题模式",
    light_mode: "亮色",
    dark_mode: "暗色",
    language_settings: "语言设置",
    language: "语言",
    interface_settings: "界面设置",
    sidebar_collapsed: "折叠侧边栏",
    save_settings: "保存设置",
    reset: "恢复默认",
    save_success: "设置保存成功",
    reset_success: "设置已重置为默认值",
  },
  problems: {
    list_title: '题目列表',
    search_placeholder: '搜索题目标题或ID',
    id: '题号',
    title: '标题',
    difficulty: '难度',
    submission: '提交次数',
    accepted: '通过次数',
    acceptance_rate: '通过率',
    status: '状态',
    status_accepted: '已解决',
    status_attempted: '尝试过',
    filter: '筛选',
    filter_problems: '筛选题目',
    all: '全部',
    easy: '简单',
    medium: '中等',
    hard: '困难',
    solved: '已解决',
    attempted: '尝试过',
    unsolved: '未解决',
    tags: '标签',
    no_problems: '没有找到题目',
    fetch_error: '获取题目失败',
    problem_not_found: '题目不存在',
    invalid_problem_id: '无效的题目ID',
    fetch_error: '获取题目详情失败',
    description: '题目描述',
    solution: '题解',
    submissions: '提交记录',
    input_description: '输入描述',
    output_description: '输出描述',
    examples: '示例',
    example: '示例',
    input: '输入',
    output: '输出',
    hints: '提示',
    source: '来源',
    solution_placeholder: '题解将在您解决问题后或比赛结束时可用。',
    submissions_placeholder: '您的提交记录将显示在这里。',
    submit_solution: '提交解答',
    submit_placeholder: '提交功能即将推出。',

    /* Submission */
    submit: '提交代码',
    select_language: '选择语言',
    format_code: '格式化代码',
    reset_template: '重置',
    submit_solution: '提交解答',
    run_code: '运行代码',
    running_code: '运行中...',
    last_submitted: '上次提交',
    submission_success: '代码提交成功',
    submission_error: '代码提交失败',
    submission_received: '您的提交已收到',
    code_formatted: '代码已格式化',
    code_reset: '代码已重置为模板',
    run_success: '代码执行成功',
    run_error: '代码执行失败',
    editor_load_error: '加载代码编辑器失败',
    format_error: '格式化代码时发生错误',
    reset_error: '重置代码时发生错误',
    language_change_error: '切换语言时发生错误',
    initializing_editor: '正在初始化编辑器...',
    submission_history: '提交历史',
    submission_sent: '提交成功',
  },
  admin: {
    /* Dashboard Layout */
    title: '管理后台',
    description: '管理用户、题目、标签和竞赛',
    dashboard: '控制台',
    users: '用户管理',
    problems: '题目管理',
    tags: '标签管理',
    contests: '竞赛管理',

    /* Dashboard */
    dashboard_title: '管理控制台',
    total_users: '用户总数',
    active_users: '活跃用户',
    verified_users: '已验证用户',
    today_registered: '今日注册',
    of_total: '占总数',
    recent_users: '最近注册用户',
    view_all: '查看全部',
    register_time: '注册时间',
    status: '状态',
    actions: '操作',
    details: '详情',
    email_verified: '邮箱状态',
    verified: '已验证',
    unverified: '未验证',
    fetch_data_error: '获取仪表板数据失败',

    /* 用户管理 */
    user_management: '用户管理',
    search_user: '搜索用户名或邮箱',
    email_verified: '邮箱状态',
    verified: '已验证',
    unverified: '未验证',
    role: '角色',
    status: '状态',
    actions: '操作',
    view: '查看',
    disable: '禁用',
    enable: '启用',
    delete: '删除',
    user_details: '用户详情',
    user_id: '用户ID',
    last_login: '最后登录',
    never: '从未登录',
    bio: '个人简介',
    school: '学校',
    github: 'GitHub账号',
    confirm_delete: '确认删除',
    delete_confirmation: '您确定要删除用户 {username} 吗？此操作不可撤销。',
    confirm: '确认',
    status_confirmation: '您确定要{action}用户 {username} 吗？',
    cannot_change_super_admin: '无法修改超级管理员',
    cannot_delete_super_admin: '无法删除超级管理员',
    cannot_change_admin: '普通管理员无法修改其他管理员',
    cannot_delete_admin: '普通管理员无法删除其他管理员',
    status_updated: '用户状态更新成功',
    user_deleted: '用户删除成功',
    fetch_users_error: '获取用户列表失败',
    update_status_error: '更新用户状态失败',
    delete_user_error: '删除用户失败',
    normal: '正常',
    disabled: '禁用',
    /* 题目管理 */
    problem_management: '题目管理',
    search_problem: '搜索题目标题或ID',
    add_problem: '添加题目',
    edit_problem: '编辑题目',
    delete_problem: '删除题目',
    confirm_delete: '确认删除',
    delete_problem_confirmation: '您确定要删除题目"{title}"吗？此操作不可撤销。',
    confirm: '确认',
    discard_changes: '放弃未保存的更改？',
    problem_deleted: '题目删除成功',
    problem_updated: '题目更新成功',
    problem_created: '题目创建成功',
    delete_problem_error: '删除题目失败',
    update_problem_error: '更新题目失败',
    create_problem_error: '创建题目失败',
    fetch_problem_error: '获取题目详情失败',
    fetch_problems_error: '获取题目列表失败',
    title_required: '标题不能为空',
    title_length: '标题长度必须在3-100个字符之间',
    description_required: '描述不能为空',
    input_description_required: '输入描述不能为空',
    output_description_required: '输出描述不能为空',
    time_limit: '时间限制',
    time_limit_required: '时间限制不能为空',
    time_limit_range: '时间限制必须在1-10000毫秒之间',
    time_limit_help: '最大执行时间（毫秒）',
    memory_limit: '内存限制',
    memory_limit_required: '内存限制不能为空',
    memory_limit_range: '内存限制必须在1-1024兆字节之间',
    memory_limit_help: '最大内存使用量（兆字节）',
    difficulty_required: '难度不能为空',
    status_required: '状态不能为空',
    judge_mode_required: '评判模式不能为空',
    special_judge_lang_required: '特殊评判语言不能为空',
    special_judge_code_required: '特殊评判代码不能为空',
    add_example: '添加示例',
    add_hint: '添加提示',
    input_required: '输入不能为空',
    output_required: '输出不能为空',
    edit: '编辑',
    preview: '预览',
    delete: '删除',
    status_visible: '可见',
    status_hidden: '隐藏',
    status_contest_only: '仅比赛可用',
    status_unknown: '未知',
    judge_mode: '评判模式',
    judge_mode_normal: '普通评判',
    judge_mode_special: '特殊评判',
    special_judge_lang: '特殊评判语言',
    special_judge_code: '特殊评判代码',
    tags: '标签',

    /* 标签管理 */
    tag_management: '标签管理',
    search_tag: '搜索标签',
    add_tag: '添加标签',
    edit_tag: '编辑标签',
    tag_name: '标签名称',
    color: '颜色',
    preview: '预览',
    tag_preview: '标签预览',
    create_time: '创建时间',
    confirm_delete: '确认删除',
    delete_tag_confirmation: '您确定要删除标签"{name}"吗？此操作可能会影响使用此标签的题目。',
    tag_deleted: '标签删除成功',
    tag_updated: '标签更新成功',
    tag_created: '标签创建成功',
    delete_tag_error: '删除标签失败',
    update_tag_error: '更新标签失败',
    create_tag_error: '创建标签失败',
    fetch_tags_error: '获取标签列表失败',
    tag_name_required: '标签名称不能为空',
    tag_name_length: '标签名称长度必须在1-20个字符之间',
    color_required: '颜色不能为空',
  },
  notfound: {
    title: "抱歉，您访问的页面不存在。",
    back_to_home: "返回首页",
  },
  submissions: {
    title: '提交记录',
    status: '状态',
    language: '语言',
    time: '耗时',
    memory: '内存',
    submit_time: '提交时间',
    submitting: '提交中',
    poll_error: '轮询提交状态失败',
    accepted: '通过',
    finished_with_status: '评测完成，状态',
    already_submitting: '正在提交中，请稍候...',
    last_submission_status: '最后一次提交状态',
    message: '信息',
    fetch_list_error: '获取提交列表失败',
    view_code_title: '查看代码',
  },
};
