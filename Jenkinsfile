pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh './conf/scripts/install_node_for_user.sh'
                sh 'mkdir -p ~/.npm-global'
                sh 'NPM_CONFIG_PREFIX=~/.npm-global'
                sh 'npm install'
                sh 'cd public'
                sh 'bower install'
                sh 'cd ..'
            }
        }
        stage('Test') {
            steps {
                sh 'npm run test'
                sh 'npm run coverage'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}
